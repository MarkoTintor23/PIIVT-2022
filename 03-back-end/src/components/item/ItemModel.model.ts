import IModel from "../../common/IModel.interface";
import CategoryModel from "../category/CategoryModel.model";

export default class ItemModel implements IModel {
    itemId: number;
    name: string;
    description: string;
    categoryId: number;
    isActive: boolean;

    category?: CategoryModel = null;
}