import BaseService from "../../common/BaseService"
import IAdapterOptions from "../../common/IAdapterOptions.interface"
import ItemModel from "./ItemModel.model"

export interface IItemAdapterOptions extends IAdapterOptions {
    loadCategory: false,
    loadSizes: false,
}

export default class ItemService extends BaseService<ItemModel, IItemAdapterOptions> {
    tableName(): string {
        return "item";
    }

     adaptToModel(data: any, options: IItemAdapterOptions): Promise<ItemModel> {
        return new Promise (async (resolve) => {
            const item = new ItemModel();

            item.itemId      = +data?.item_id;
            item.name        = data?.name;
            item.description = data?.description;
            item.categoryId  = +data?.category_id;
            item.isActive    = +data?.is_active === 1;

            

            if (options.loadSizes) {
                item.sizes = await this.services.size.getAllByItemId(item.itemId, {});
            }

            resolve(item);
        })
    }
}