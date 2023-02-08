import IModel from "../../common/IModel.interface";
import ItemModel from "../item/ItemModel.model";

export interface ICartContentItem {
    item: ItemModel;
    quantity: number;
}

export default class CartModel implements IModel {
    cartId: number;
    userId: number;
    createdAt: Date;

    content: ICartContentItem[];

    isUsed: boolean;
}