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
import IConfig, { IResize } from "../../common/IConfig.interface";
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

        this.services.category.getById(categoryId, { loadIngredients: false })
        .then(result => {
            if (result === null) {
                return res.status(404).send("Category not found");
            }

            this.services.item.getAllByCategoryId(categoryId, {
                loadCategory: false,
                loadIngredients: true,
                loadSizes: true,
                hideInactiveSizes: true,
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

        this.services.category.getById(categoryId, { loadIngredients: false })
        .then(result => {
            if (result === null) {
                return res.status(404).send("Category not found");
            }

            this.services.item.getById(itemId, {
                loadCategory: true,
                loadIngredients: true,
                loadSizes: true,
                hideInactiveSizes: true,
                loadPhotos: true,
            })
            .then(result => {
                if (result === null) {
                    return res.status(404).send("Item not found!");
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

        this.services.category.getById(categoryId, { loadIngredients: true })
        .then(resultCategory => {
            if (resultCategory === null) {
                throw {
                    status: 404,
                    message: "Category not found!",
                }
            }

            return resultCategory;
        })
        .then(resultCategory => {
            const availableIngredientIds: number[] = resultCategory.ingredients?.map(ingredient => ingredient.ingredientId);

            for (let givenIngredientId of data.ingredientIds) {
                if (!availableIngredientIds.includes(givenIngredientId)) {
                    throw {
                        status: 404,
                        message: `Ingredient ${givenIngredientId} not found in this category!`,
                    }
                }
            }

            return this.services.size.getAll({});
        })
        .then(sizes => {
            const availableSizeIds: number[] = sizes.map(size => size.sizeId);

            for (let givenSizeInformation of data.sizes) {
                if (!availableSizeIds.includes(givenSizeInformation.sizeId)) {
                    throw {
                        status: 404,
                        message: `Size with ID ${givenSizeInformation.sizeId} not found!`,
                    }
                }
            }
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
            for (let givenIngredientId of data.ingredientIds) {
                this.services.item.addItemIngredient({
                    item_id: newItem.itemId,
                    ingredient_id: givenIngredientId,
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
            for (let givenSizeInformation of data.sizes) {
                this.services.item.addItemSize({
                    item_id: newItem.itemId,
                    size_id: givenSizeInformation.sizeId,
                    price: givenSizeInformation.price,
                    kcal: givenSizeInformation.kcal,
                    is_active: 1,
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
                loadIngredients: true,
                loadSizes: true,
                hideInactiveSizes: true,
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

        this.services.category.getById(categoryId, { loadIngredients: false })
        .then(result => {
            if (result === null) throw {
                code: 400,
                message: "Category not found!",
            };

            return result;
        })
        .then(() => {
            return this.services.item.getById(itemId, {
                loadCategory: false,
                loadIngredients: false,
                loadSizes: false,
                hideInactiveSizes: true,
                loadPhotos: false,
            });
        })
        .then(result => {
            if (result === null) throw {
                code: 404,
                message: "Item not found!",
            };

            if (result.categoryId !== categoryId) throw {
                code: 404,
                message: "Item not found in this category!",
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
                        message: "Failed to add this photo into the database!",
                    };
                }

                photos.push(photo);
            }

            res.send(photos);
        })
        .catch(error => {
            res.status(error?.code).send(error?.message);
        });
      
        private async doFileUpload(req: Request): Promise<string[] | null> {
        const config: IConfig = DevConfig;

        if (!req.files || Object.keys(req.files).length === 0) throw {
            code: 400,
            message: "No file were uploaded!",
        };
    }
}