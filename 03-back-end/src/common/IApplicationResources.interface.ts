import * as mysql2 from "mysql2/promise";
import CategoryService from "../components/category/CategoryService.service";

export interface IServices {
    category: CategoryService;
}


export default interface IApplicationResources {
    databaseConnection: mysql2.Connection;
    services: IServices;
}