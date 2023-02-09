import IManufacturer from "./IManufacturer.model";

export default interface ICategory {
    categoryId: number;
    name: string;
    Manufacturers?: IManufacturer[];
}