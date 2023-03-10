import BaseService from "../../common/BaseService";
import IAdapterOptions from "../../common/IAdapterOptions.interface";
import ItemModel from "../item/ItemModel.model";
import CartModel, { ICartContentItem } from "./CartModel.model";

export interface ICartAdapterOptions extends IAdapterOptions {

}

interface ICartContentItemData {
    cart_id: number,
    item_size_id: number,
    quantity: number,
}

export default class CartService extends BaseService<CartModel, ICartAdapterOptions> {
    tableName(): string {
        return "cart";
    }

    adaptToModel(data: any, options: ICartAdapterOptions = {}): Promise<CartModel> {
        return new Promise(async (resolve, reject) => {
            const cart = new CartModel();

            cart.cartId = +data?.cart_id;
            cart.userId = +data?.user_id;
            cart.createdAt = new Date(data?.created_at);

            cart.isUsed = false;

            if (await this.services.order.getByCartId(cart.cartId)) {
                cart.isUsed = true;
            }

            cart.content = [];

            this.getAllFromTableByFieldNameAndValue<ICartContentItemData>("cart_content", "cart_id", cart.cartId)
            .then(async result => {
                if (result.length === 0) {
                    return cart;
                }


                return cart;
            })
            .then(cart => {
                resolve(cart);
            })
            .catch(error => {
                reject(error);
            });
        });
    }
    
    async getUserCart(id: number): Promise<CartModel> {
        return new Promise((resolve, reject) => {
            this.getAllByUserId(id)
            .then(carts => {
                if (carts.length === 0) {
                    return this.createNewCart(id);
                }

                const lastCart = carts[carts.length - 1];

                if (lastCart.isUsed) {
                    return this.createNewCart(id);
                }

                return lastCart;
            })
            .then(cart => {
                resolve(cart);
            })
            .catch(error => {
                reject(error);
            });
        });
    }

    async getAllByUserId(userId: number, options: ICartAdapterOptions = {}): Promise<CartModel[]> {
        return this.getAllByFieldNameAndValue("user_id", userId, options);
    }

    private async createNewCart(userId: number): Promise<CartModel> {
        return this.baseAdd(
            { user_id: userId },
            { }
        );
    }

    public async editCartContentItemQuantity(cartId: number, itemId: number, sizeId: number, quantity: number): Promise<CartModel> {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE
                            cart_content
                        SET
                            cart_content.quantity = ?
                        WHERE
                            cart_content.cart_id = ?
                            AND cart_content.item_size_id = (
                                SELECT
                                    item_size.item_size_id
                                FROM
                                    item_size
                                WHERE
                                    item_size.item_id = ?
                                    AND item_size.size_id = ?
                                LIMIT 1
                            )`;
            this.db.execute(sql, [ quantity, cartId, itemId, sizeId ])
            .then(() => {
                resolve(this.getById(cartId, { }));
            })
            .catch(error => {
                reject(error);
            });
        });
    }

    public async addCartContentItem(cartId: number, itemId: number, sizeId: number, quantity: number): Promise<CartModel> {
        return new Promise((resolve, reject) => {
            const sql = `INSERT cart_content
                         SET
                            cart_content.cart_id = ?,
                            cart_content.item_size_id = (
                                SELECT
                                    item_size.item_size_id
                                FROM
                                    item_size
                                WHERE
                                    item_size.item_id = ?
                                    AND item_size.size_id = ?
                                LIMIT 1
                            ),
                            cart_content.quantity = ?;`;

            this.db.execute(sql, [ cartId, itemId, sizeId, quantity ])
            .then(() => {
                resolve(this.getById(cartId, { }));
            })
            .catch(error => {
                reject(error);
            });
        });
    }

    public async deleteCartContentItem(cartId: number, itemId: number, sizeId: number): Promise<CartModel> {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM cart_content
                         WHERE
                            cart_content.cart_id = ?
                            AND
                            cart_content.item_size_id = (
                                SELECT
                                    item_size.item_size_id
                                FROM
                                    item_size
                                WHERE
                                    item_size.item_id = ?
                                    AND item_size.size_id = ?
                                LIMIT 1
                            );`;

            this.db.execute(sql, [ cartId, itemId, sizeId ])
            .then(() => {
                resolve(this.getById(cartId, { }));
            })
            .catch(error => {
                reject(error);
            });
        });
    }
}