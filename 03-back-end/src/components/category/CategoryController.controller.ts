import CategoryService, {DefaultCategoryAdapterOptions} from "./CategoryService.service";
import{Request, Response} from "express";
import { AddCategoryValidator } from "./dto/IAddCategory.dto";
import IAddCategory from './dto/IAddCategory.dto';
import IEditCategory, { EditCategoryValidator, IEditCategoryDto } from "./dto/IEditCategory.dto";
import BaseController from "../../common/BaseController";
import { AddManufacturerValidator, IAddManufacturerDto } from "../manufacturer/dto/IAddManufacturer.dto";
import { EditManufacturerValidator, IEditManufacturerDto } from "../manufacturer/dto/IEditManufacturer.dto";
class CategoryController extends BaseController {


    async getAll(req: Request, res: Response){
        this.services.category.getAll(DefaultCategoryAdapterOptions)
        .then(result =>{
            res.send(result);
        })
        .catch(error => {
            res.status(500).send(error?.massage);
        });
    }


    async getById(req: Request, res: Response) {
        const id: number = +req.params?.id;

        this.services.category.getById(id, {
            loadManufacturers: true
        })
        .then(result => {
            if (result === null) {
                return res.sendStatus(404);
            }

            res.send(result);
        })
        .catch(error => {
            res.status(500).send(error?.message);
        });
    }

    async add(req: Request, res: Response){
        const data = req.body as IAddCategory;


        if (!AddCategoryValidator(data)){
            res.status(400).send(AddCategoryValidator.errors);
        }

        this.services.category.add(data)
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            res.status(400).send(error?.message);
        });
    }

    async edit(req: Request, res: Response){
        const id: number = +req.params?.cid;

        const data = req.body as IEditCategoryDto;

        if (!EditCategoryValidator(data)){
            res.status(400).send(EditCategoryValidator.errors);
        }
        this.services.category.getById(id,DefaultCategoryAdapterOptions)
        .then(result => {
            if(result == null){
                return res.sendStatus(404);
        }
           this.services.category.editById(id,{ 
            name: data.name})
            .then(result => {
                res.send(result);
            })
            .catch(error => {
                res.status(400).send(error?.message);
            })
    })
    .catch(error => {
        res.status(500).send(error?.massage);
    }); 
    }


    async addManufacturer(req: Request, res: Response) {
        const categoryId: number = +req.params?.cid;
        const data               =  req.body as IAddManufacturerDto;

        if (!AddManufacturerValidator(data)) {
            return res.status(400).send(AddManufacturerValidator.errors);
        }

        this.services.category.getById(categoryId, { loadManufacturers: false })
        .then(result => {
            if (result === null) {
                throw {
                    status: 404,
                    message: 'Manufacturer not found',
                }
            }
        })
        .then(() => {
            return this.services.manufacturer.add({
                name: data.name,
                category_id: categoryId
            })
        })
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            res.status(error?.status ?? 500).send(error?.message);
        });
    }

    async editIngredient(req: Request, res: Response) {
        const categoryId: number       = +req.params?.cid;
        const manufacturerId: number     = +req.params?.iid;
        const data: IEditManufacturerDto =  req.body as IEditManufacturerDto;

        if (!EditManufacturerValidator(data)) {
            return res.status(400).send(EditManufacturerValidator.errors);
        }

        this.services.category.getById(categoryId, { loadManufacturers: false })
        .then(result => {
            if (result === null) {
                throw {
                    status: 404,
                    message: 'Category not found!',
                }
            }
        })
        .then(() => {
            return this.services.manufacturer.getById(manufacturerId, {});
        })
        .then(result => {
            if (result === null) {
                throw {
                    status: 404,
                    message: 'Manufacturer not found!',
                }
            }
            if (result.categoryId !== categoryId) {
                throw {
                    status: 400,
                    message: 'This manufacturer does not belong to this category!',
                }
            }
        })
        .then(() => {
            return this.services.manufacturer.editById(manufacturerId, data)
        })
        .then(result => {
            res.send(result);
        })
        .catch(error => {
            res.status(error?.status ?? 500).send(error?.message);
        });
    }
}

export default CategoryController;