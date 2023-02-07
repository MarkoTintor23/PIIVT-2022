import { resolve } from "path";
import BaseService from "../../common/BaseService"
import IAdapterOptions from "../../common/IAdapterOptions.interface"
import { DevConfig } from "../../configs";
import IAddItem, { IItemManufacturer} from "./dto/IAddItem.dto";
import IEditItem from "./dto/IEditItem.dto";
import ItemModel from "./ItemModel.model"

export interface IItemAdapterOptions extends IAdapterOptions {
    loadCategory: boolean,
    loadManufacturers: boolean,
    loadPhotos: boolean,
}

export const DefaultItemAdapterOptions: IItemAdapterOptions = {
    loadCategory: false,
    loadManufacturers: false,
    loadPhotos: false,
}

export default class ItemService extends BaseService<ItemModel, IItemAdapterOptions> {
    tableName(): string {
        return "item";
    }

    adaptToModel(data: any, options: IItemAdapterOptions): Promise<ItemModel> {
        return new Promise(async (resolve) => {
            const item = new ItemModel();

            item.itemId      = +data?.item_id;
            item.name        = data?.name;
            item.description = data?.description;
            item.categoryId  = +data?.category_id;
            item.isActive    = +data?.is_active === 1;

            if (options.loadCategory) {
                item.category = await this.services.category.getById(item.categoryId, {
                    loadManufacturers: true,
                });
            }

            if (options.loadManufacturers) {
                item.manufacturers = await this.services.manufacturer.getAllByItemId(item.itemId, {});
            }

            if (options.loadPhotos) {
                item.photos = await this.services.photo.getAllByItemId(item.itemId);
            }

            resolve(item);
        })
    }

    async getAllByCategoryId(categoryId: number, options: IItemAdapterOptions) {
        return this.getAllByFieldNameAndValue("category_id", categoryId, options);
    }

    async add(data: IAddItem): Promise<ItemModel> {
        return this.baseAdd(data, DefaultItemAdapterOptions);
    }

    async edit(itemId: number, data: IEditItem, options: IItemAdapterOptions): Promise<ItemModel> {
        return this.baseEditById(itemId, data, options);
    }

    async addItemManufacturer(data: IItemManufacturer): Promise<number> {
        return new Promise((resolve, reject) => {
            const sql: string = "INSERT item_manufacturer SET item_id = ?, manufacturer_id = ?;";

            this.db.execute(sql, [ data.item_id, data.manufacturer_id ])
            .then(async result => {
                const info: any = result;
                resolve(+(info[0]?.insertId));
            })
            .catch(error => {
                reject(error);
            });
        })
    }

    private async deleteAllOrdersByItemId(itemId: number): Promise<true> {
        return new Promise(resolve => {
            const sql = `DELETE FROM \`order\` WHERE \`order\`.cart_id IN (
                            SELECT
                                cart.cart_id
                            FROM
                                cart
                            INNER JOIN cart_content ON cart.cart_id = cart_content.cart_id
                            
                            INNER JOIN item_size ON cart_content.item_size_id = item_size.item_size_id
                            WHERE
                                item_size.item_id = ?
                        );`;
            this.db.execute(sql, [ itemId ])
            .then(() => {
                resolve(true);
            })
            .catch(error => {
                throw {
                    message: error?.message ?? "Could not delete orders",
                }
            });
        })
    }

    private async deleteCartContentByItemId(itemId: number): Promise<true> {
        return new Promise(resolve => {
            const sql = `DELETE FROM cart_content WHERE cart_content.item_size_id IN (
                            SELECT
                                item_size_id
                            FROM
                                item_size
                            WHERE
                                item_size.item_id = ?
                        );`;
            this.db.execute(sql, [ itemId ])
            .then(() => {
                resolve(true);
            })
            .catch(error => {
                throw {
                    message: error?.message ?? "Could not delete cart content!",
                }
            });
        })
    }

    private async deleteCartsByItemId(itemId: number): Promise<true> {
        return new Promise(resolve => {
            const sql = `DELETE FROM cart WHERE cart.cart_id IN (
                            SELECT
                                cart.cart_id
                            FROM
                                cart
                            INNER JOIN cart_content ON cart.cart_id = cart_content.cart_id
                            INNER JOIN item_size ON cart_content.item_size_id = item_size.item_size_id
                            WHERE
                                item_size.item_id = ?
                        );`;
            this.db.execute(sql, [ itemId ])
            .then(() => {
                resolve(true);
            })
            .catch(error => {
                throw {
                    message: error?.message ?? "Could not delete carts!",
                }
            });
        })
    }
}