import CategoryModel from "./CategoryModel.model";
import * as mysql2 from "mysql2/promise";
import IAddCategory from './dto/IAddCategory.dto';
import BaseService from "../../common/BaseService";
import IAdapterOptions from "../../common/IAdapterOptions.interface"
import IEditCategory from "./dto/IEditCategory.dto";

interface ICategoryAdapterOptions extends IAdapterOptions{
    
}

const DefaultCategoryAdapterOptions: ICategoryAdapterOptions = {

}


class CategoryService extends BaseService<CategoryModel, ICategoryAdapterOptions>{
    tableName(): string {

    
    return "category";

    }

     async adaptToModel(data: any): Promise<CategoryModel>{
        const category: CategoryModel = new CategoryModel();

        category.categoryId = +data?.category_id;
        category.name = data?.name;
        return category;
    }

   

    public async add(data: IAddCategory): Promise<CategoryModel> {
       return this.baseAdd(data, DefaultCategoryAdapterOptions);
    }

    public async editById(categoryId: number, data: IEditCategory): Promise<CategoryModel> {
        return this.baseEditById(categoryId, data, DefaultCategoryAdapterOptions);
    }
}

export default CategoryService;
export{DefaultCategoryAdapterOptions};