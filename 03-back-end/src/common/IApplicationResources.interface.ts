import * as mysql2 from "mysql2/promise";
import CategoryService from "../components/category/CategoryService.service";
import AdministratorService from '../components/administrator/AdministratorService.service';
import ManufacturerService from "../components/manufacturer/ManufacturerService.service";
import SizeService from "../components/size/SizeService.service";
import ItemService from "../components/item/ItemService.service";

export interface IServices {
    category: CategoryService;
    administrator: AdministratorService;
    manufacturer: ManufacturerService;
    size: SizeService;
    item: ItemService;
}


export default interface IApplicationResources {
    databaseConnection: mysql2.Connection;
    services?: IServices;
}