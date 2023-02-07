import IModel from "../../common/IModel.interface";
import CategoryModel from "../category/CategoryModel.model";
import ManufacturerModel from "../manufacturer/ManufacturerModel.model";
import PhotoModel from "../photo/PhotoModel.model";


export default class ItemModel implements IModel {
    itemId: number;
    name: string;
    description: string;
    categoryId: number;
    isActive: boolean;

    category?: CategoryModel = null;
    manufacturers?: ManufacturerModel[] = [];
    photos?: PhotoModel[] = [];
}