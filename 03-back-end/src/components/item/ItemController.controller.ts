import { Request, Response } from "express";
import BaseController from "../../common/BaseController";
import { AddItemValidator, IAddItemDto } from "./dto/IAddItem.dto";
import { fstat, mkdirSync, readFileSync, unlinkSync } from "fs";
import { UploadedFile } from "express-fileupload";
import filetype from 'magic-bytes.js'
import { extname, basename, dirname } from "path";
import sizeOf from "image-size";
import * as uuid from "uuid";
import PhotoModel from "../photo/PhotoModel.model";
import IConfig from "../../common/IConfig.interface";
import { DevConfig } from "../../configs";
import * as sharp from "sharp";
import CategoryModel from "../category/CategoryModel.model";
import ItemModel from "./ItemModel.model";
import { EditItemValidator, IEditItemDto } from "./dto/IEditItem.dto";
import { DefaultCategoryAdapterOptions } from "../category/CategoryService.service";
import { DefaultItemAdapterOptions } from "./ItemService.service";

export default class ItemController extends BaseController {
    async getAllItemsByCategoryId(req: Request, res: Response) {
        const categoryId: number = +req.params?.cid;

        this.services.category.getById(categoryId, { loadManufacturers: false })
        .then(result => {
            if (result === null) {
                return res.status(404).send("Category not found");
            }

            this.services.item.getAllByCategoryId(categoryId, {
                loadCategory: false,
                loadManufacturers: true,
                loadPhotos: true,
            })
            .then(result => {
                res.send(result);
            })
            .catch(error => {
                res.status(500).send(error?.message);
            });
        })
        .catch(error => {
            res.status(500).send(error?.message);
        });
    }

    async getItemById(req: Request, res: Response) {
        const categoryId: number = +req.params?.cid;
        const itemId: number = +req.params?.iid;

        this.services.category.getById(categoryId, { loadManufacturers: false })
        .then(result => {
            if (result === null) {
                return res.status(404).send("Category not found");
            }

            this.services.item.getById(itemId, {
                loadCategory: true,
                loadManufacturers: true,
                loadPhotos: true,
            })
            .then(result => {
                if (result === null) {
                    return res.status(404).send("Item not found");
                }

                if (result.categoryId !== categoryId) {
                    return res.status(404).send("Item not found in this category");
                }

                res.send(result);
            })
            .catch(error => {
                res.status(500).send(error?.message);
            });
        })
        .catch(error => {
            res.status(500).send(error?.message);
        });
    }

    async add(req: Request, res: Response) {
        const categoryId: number = +req.params?.cid;
        const data               =  req.body as IAddItemDto;

        if (!AddItemValidator(data)) {
            return res.status(400).send(AddItemValidator.errors);
        }

        this.services.category.getById(categoryId, { loadManufacturers: true })
        .then(resultCategory => {
            if (resultCategory === null) {
                throw {
                    status: 404,
                    message: "Category not found",
                }
            }

            return resultCategory;
        })
        .then(() => {
            return this.services.item.startTransaction();
        })
        .then(() => {
            return this.services.item.add({
                name: data.name,
                category_id: categoryId,
                description: data.description,
            });
        })
        .then(newItem => {
            for (let givenManufacturerId of data.ManufacturerIds) {
                this.services.item.addItemManufacturer({
                    item_id: newItem.itemId,
                    manufacturer_id: givenManufacturerId,
                })
                .catch(error => {
                    throw {
                        status: 500,
                        message: error?.message
                    }
                });
            }

            return newItem;
        })
        .then(newItem => {
            return this.services.item.getById(newItem.itemId, {
                loadCategory: true,
                loadManufacturers: true,
                loadPhotos: false,
            });
        })
        .then(async result => {
            await this.services.item.commitChanges();
            res.send(result);
        })
        .catch(async error => {
            await this.services.item.rollbackChanges();
            res.status(error?.status ?? 500).send(error?.message);
        })
    }

    async uploadPhoto(req: Request, res: Response) {
        const categoryId: number = +req.params?.cid;
        const itemId: number = +req.params?.iid;

        this.services.category.getById(categoryId, { loadManufacturers: false })
        .then(result => {
            if (result === null) throw {
                code: 400,
                message: "Category not found",
            };

            return result;
        })
        .then(() => {
            return this.services.item.getById(itemId, {
                loadCategory: false,
                loadManufacturers: false,
                loadPhotos: false,
            });
        })
        .then(result => {
            if (result === null) throw {
                code: 404,
                message: "Item not found",
            };

            if (result.categoryId !== categoryId) throw {
                code: 404,
                message: "Item not found in this category",
            };

            return this.doFileUpload(req);
        })
        .then(async uploadedFiles => {
            const photos: PhotoModel[] = [];

            for (let singleFile of await uploadedFiles) {
                const filename = basename(singleFile);

                const photo = await this.services.photo.add({
                    name: filename,
                    file_path: singleFile,
                    item_id: itemId,
                });

                if (photo === null) {
                    throw {
                        code: 500,
                        message: "Failed to add this photo into the database",
                    };
                }

                photos.push(photo);
            }

            res.send(photos);
        })
        .catch(error => {
            res.status(error?.code).send(error?.message);
        });
    }

    private async doFileUpload(req: Request): Promise<string[] | null> {
        const config: IConfig = DevConfig;

        if (!req.files || Object.keys(req.files).length === 0) throw {
            code: 400,
            message: "No file was uploaded",
        };

        const fileFieldNames = Object.keys(req.files);

        const now = new Date();
        const year = now.getFullYear();
        const month = ((now.getMonth() + 1) + "").padStart(2, "0");

        const uploadDestinationRoot = config.server.static.path + "/";
        const destinationDirectory  = config.fileUploads.destinationDirectoryRoot + year + "/" + month + "/";

        mkdirSync(uploadDestinationRoot + destinationDirectory, {
            recursive: true,
            mode: "755",
        });

        const uploadedFiles = [];

        for (let fileFieldName of fileFieldNames) {
            const file = req.files[fileFieldName] as UploadedFile;

            const type = filetype(readFileSync(file.tempFilePath))[0]?.typename;

            if (!config.fileUploads.photos.allowedTypes.includes(type)) {
                unlinkSync(file.tempFilePath);
                throw {
                    code: 415,
                    message: `File ${fileFieldName} - type is not supported`,
                };
            }

            file.name = file.name.toLocaleLowerCase();

            const declaredExtension = extname(file.name);

            if (!config.fileUploads.photos.allowedExtensions.includes(declaredExtension)) {
                unlinkSync(file.tempFilePath);
                throw {
                    code: 415,
                    message: `File ${fileFieldName} - extension is not supported`,
                };
            }

            const size = sizeOf(file.tempFilePath);

            if ( size.width < config.fileUploads.photos.width.min || size.width > config.fileUploads.photos.width.max ) {
                unlinkSync(file.tempFilePath);
                throw {
                    code: 415,
                    message: `File ${fileFieldName} - image width is not supported`,
                };
            }

            if ( size.height < config.fileUploads.photos.height.min || size.height > config.fileUploads.photos.height.max ) {
                unlinkSync(file.tempFilePath);
                throw {
                    code: 415,
                    message: `File ${fileFieldName} - image height is not supported`,
                };
            }

            const fileNameRandomPart = uuid.v4();

            const fileDestinationPath = uploadDestinationRoot + destinationDirectory + fileNameRandomPart + "-" + file.name;

            file.mv(fileDestinationPath, async error => {
                if (error) {
                    throw {
                        code: 500,
                        message: `File ${fileFieldName} - could not be saved on the server`,
                    };
                }
            });

            uploadedFiles.push(destinationDirectory + fileNameRandomPart + "-" + file.name);
        }

        return uploadedFiles;
    }

    async edit(req: Request, res: Response) {
        const categoryId: number = +req.params?.cid;

        const data = req.body as IEditItemDto;

        if (!EditItemValidator(data)) {
            return res.status(400).send(EditItemValidator.errors);
        }

        this.services.category.getById(categoryId, { loadManufacturers: true, })
        .then(result => {
            if (result === null) {
                throw {
                    status: 404,
                    message: "Category not found"
                };
            }

            return result as CategoryModel;
        })
        .then(async category => {
            const itemId: number = +req.params?.iid;

            return this.retrieveItem(category, itemId);
        })
        .then(this.checkItem)
        .then(async result => {
            await this.services.item.startTransaction();
            return result;
        })
        .then(async result => {
            const currentManufacturers  = result.item.manufacturers?.map(manufacturer => manufacturer.manufacturerId);
            const newManufacturerIds = data.manufacturerIds;

            const availableManufacturerIds = result.category.manufacturers?.map(i => i.manufacturerId);

            for (let id of data.manufacturerIds) {
                if (!availableManufacturerIds.includes(id)) {
                    throw {
                        status: 400,
                        message: "Manufacturer " + id + " is not available for items in this category",
                    }
                }
            }

            const ManufacturerIdsToAdd = newManufacturerIds.filter(id => !currentManufacturers.includes(id));
            for (let id of ManufacturerIdsToAdd) {
                if (!await this.services.item.addItemManufacturer({
                    item_id: result.item.itemId,
                    manufacturer_id: id,
                })) {
                    throw {
                        status: 500,
                        message: "Error adding a new manufacturer to this item!"
                    }
                };
            }

        })
           

        .then(async result => {
            await this.services.item.commitChanges();

            res.send(
                await this.services.item.getById(result.item.itemId, {
                    loadCategory: true,
                    loadManufacturers: true,
                    loadPhotos: true,
                })
            );
        })
        .catch(async error => {
            await this.services.item.rollbackChanges();

            res.status(error?.status ?? 500).send(error?.message);
        });
    }

    private async retrieveItem(category: CategoryModel, itemId: number): Promise<{ category: CategoryModel, item: ItemModel|null }> {
        return {
            category: category,
            item: await this.services.item.getById(itemId, {
                loadCategory: false,
                loadManufacturers: true,
                loadPhotos: false,
            })
        }
    }

    private checkItem(result: { category: CategoryModel, item: ItemModel|null }): { category: CategoryModel, item: ItemModel } {
        if (result.item === null) {
            throw {
                status: 404,
                message: "Item not found"
            };
        }

        if (result.item.categoryId !== result.category.categoryId) {
            throw {
                status: 404,
                message: "Item not found in this category"
            };
        }

        return result;
    }

    async deletePhoto(req: Request, res: Response) {
        const categoryId: number = +(req.params?.cid);
        const itemId: number = +(req.params?.iid);
        const photoId: number = +(req.params?.pid);

        this.services.category.getById(categoryId, DefaultCategoryAdapterOptions)
        .then(result => {
            if (result === null) throw { status: 404, message: "Category not found!" };
            return result;
        })
        .then(async category => {
            return {
                category: category,
                item: await this.services.item.getById(itemId, {
                    loadPhotos: true,
                    loadCategory: false,
                    loadManufacturers: false,
                }),
            };
        })
        .then( ({ category, item }) => {
            if (item === null) throw { status: 404, message: "Item not found" };
            if (item.categoryId !== category.categoryId) throw { status: 404, message: "Item not found in this category" };
            return item;
        })
        .then(item => {
            const photo = item.photos?.find(photo => photo.photoId === photoId);
            if (!photo) throw { status: 404, message: "Photo not found in this item" };
            return photo;
        })
        .then(photo => {
            const directoryPart = DevConfig.server.static.path + "/" + dirname(photo.filePath);
            const fileName      = basename(photo.filePath);

            unlinkSync( DevConfig.server.static.path + "/" + photo.filePath);

            res.send("Deleted!");
        })
        .catch(error => {
            res.status(error?.status ?? 500).send(error?.message ?? "Server side error");
        });
    }

    async delete(req: Request, res: Response) {
        const categoryId: number = +(req.params?.cid);
        const itemId: number = +(req.params?.iid);

        this.services.category.getById(categoryId, DefaultCategoryAdapterOptions)
        .then(result => {
            if (result === null) throw { status: 404, message: "Category not found" };
            return result;
        })
        .then(async category => {
            return {
                category: category,
                item: await this.services.item.getById(itemId, DefaultItemAdapterOptions),
            };
        })
        .then( ({ category, item }) => {
            if (item === null) throw { status: 404, message: "Item not found!" };
            if (item.categoryId !== category.categoryId) throw { status: 404, message: "Item not found in this category!" };
            return item;
        })
        .then(result => {
            for (let filePath of result.filesToDelete) {
                const directoryPart = dirname(filePath);
                const fileName      = basename(filePath);

                unlinkSync( filePath);
            }
        })
        .then(() => {
            res.send("Deleted!");
        })
        .catch(error => {
            res.status(error?.status ?? 500).send(error?.message ?? "Server side error!");
        });
    }
}