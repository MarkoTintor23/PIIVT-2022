import IModel from "../../common/IModel.interface";

export default class ManufacturerModel implements IModel {
    manufacturerId: number;
    name: string;

    categoryId: number;
}