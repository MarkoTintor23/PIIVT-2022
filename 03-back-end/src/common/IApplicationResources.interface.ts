import * as mysql2 from "mysql2/promise";
import CategoryService from "../components/category/CategoryService.service";
import AdministratorService from '../components/administrator/AdministratorService.service';

export interface IServices {
    category: CategoryService;
    administrator: AdministratorService;
}


export default interface IApplicationResources {
    databaseConnection: mysql2.Connection;
    services?: IServices;
}