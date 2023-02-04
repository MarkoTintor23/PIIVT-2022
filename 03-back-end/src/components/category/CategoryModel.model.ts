import IModel from "../../common/IModel.interface";
import ManufacturerModel from "../manufacturer/ManufacturerModel.model";

class CategoryModel implements IModel{
    categoryId: number;
    name: string;

    manufacturers?: ManufacturerModel[];
}

export default CategoryModel;