import Ajv from "ajv";
import IServiceData from "../../../common/IServiceData.interface";

const ajv = new Ajv();

export interface IAddItemDto {
    name: string;
    description: string;
    ManufacturerIds: number[];
    }[];


export default interface IAddItem extends IServiceData {
    name: string;
    description: string;
    category_id: number;
}

export interface IItemManufacturer extends IServiceData {
    item_id: number;
    manufacturer_id: number;
}

const AddItemValidator = ajv.compile({
    type: "object",
    properties: {
        name: {
            type: "string",
            minLength: 8,
            maxLength: 128,
        },
        description: {
            type: "string",
            minLength: 32,
            maxLength: 500,
        },
        ManufacturerIds: {
            type: "array",
            minItems: 0,
            uniqueItems: true,
            items: {
                type: "integer",
            },
        },

    required: [
        "name",
        "description",
        "manufacturerIds",
    ],
    additionalProperties: false,
}});

export { AddItemValidator };