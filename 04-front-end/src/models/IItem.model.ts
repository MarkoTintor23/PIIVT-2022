import ICategory from "./ICategory.model";
import IManufacturer from "./IManufacturer.model";
import ISize from "./ISize.model";

export default interface IItem {
    category?: ICategory | null;
    sizes: ISize[];
    manufacturers: IManufacturer[];
    photos: any[];
    itemId: number;
    name: string;
    description: string;
    categoryId: number;
    isActive: boolean;
}