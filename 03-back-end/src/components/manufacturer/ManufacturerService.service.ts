import ManufacturerModel from "./ManufacturerModel.model";
import BaseService from "../../common/BaseService";
import IAdapterOptions from "../../common/IAdapterOptions.interface";
import IAddManufacturer from "./dto/IAddManufacturer.dto";
import IEditManufacturer from "./dto/IEditManufacturer.dto";

class ManufacturerAdapterOptions implements IAdapterOptions {

}

interface ItemManufacturerInterface {
    item_manufacturer_id: number;
    item_id: number;
    manufacturer_id: number;
}

class ManufacturerService extends BaseService<ManufacturerModel, ManufacturerAdapterOptions> {
    tableName(): string {
        return "manufacturer";
    }

     async adaptToModel(data: any): Promise<ManufacturerModel> {
        const manufacturer: ManufacturerModel = new ManufacturerModel();

        manufacturer.manufacturerId = +data?.manufacturer_id;
        manufacturer.name = data?.name;
        manufacturer.categoryId = data?.category_id;

        return manufacturer;
    }

    public async getAllByCategoryId(categoryId: number, options: ManufacturerAdapterOptions): Promise<ManufacturerModel[]> {
        return this.getAllByFieldNameAndValue('category_id', categoryId, options);
    }

    public async add(data: IAddManufacturer): Promise<ManufacturerModel> {
        return this.baseAdd(data, {});
    }

    public async editById(manufacturerId: number, data: IEditManufacturer): Promise<ManufacturerModel> {
        return this.baseEditById(manufacturerId, data, {});
    }

    public async getAllByItemId(itemId: number, options: ManufacturerAdapterOptions = {}): Promise<ManufacturerModel[]> {
        return new Promise((resolve, reject) => {
            this.getAllFromTableByFieldNameAndValue<ItemManufacturerInterface>("item_manufacturer", "item_id", itemId)
            .then(async result => {
                const manufacturerIds = result.map(ii => ii.manufacturer_id);

                const manufacturers: ManufacturerModel[] = [];

                for (let manufacturerId of manufacturerIds) {
                    const manufacturer = await this.getById(manufacturerId, options);
                    manufacturers.push(manufacturer);
                }

                resolve(manufacturers);
            })
            .catch(error => {
                reject(error);
            });
        });
    }
}

export default ManufacturerService;