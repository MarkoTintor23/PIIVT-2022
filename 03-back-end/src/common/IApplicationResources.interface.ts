import * as mysql2 from "mysql2/promise";
import AdministratorService from "../components/administrator/AdministratorService.service";
import CartService from "../components/cart/CartService.service";
import OrderService from "../components/cart/OrderService.service";
import CategoryService from "../components/category/CategoryService.service";
import ManufacturerService from "../components/manufacturer/ManufacturerService.service";
import ItemService from "../components/item/ItemService.service";
import PhotoService from "../components/photo/PhotoService.service";
import AddressService from "../components/user/AddressService.service";
import UserService from "../components/user/UserService.service";

export interface IServices {
    category: CategoryService;
    manufacturer: ManufacturerService;
    administrator: AdministratorService;
    item: ItemService;
    photo: PhotoService;
    user: UserService;
    cart: CartService;
    order: OrderService;
    address: AddressService;
}

export default interface IApplicationResources {
    databaseConnection: mysql2.Connection;
    services: IServices;
}