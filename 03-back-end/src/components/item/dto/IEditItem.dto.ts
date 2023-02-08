import Ajv from "ajv";
import IServiceData from "../../../common/IServiceData.interface";

const ajv = new Ajv();

export interface IEditItemDto {
    name: string;
    description: string;
    isActive: boolean;
    manufacturerIds: number[];
}

export default interface IEditItem extends IServiceData {
    name: string;
    description: string;
    is_active: number;
}

const EditItemValidator = ajv.compile({
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
        isActive: {
            type: "boolean",
        },
        manufacturerIds: {
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
        "isActive",
        "ingredientIds",
        "sizes",
    ],
    additionalProperties: false,
}});

export { EditItemValidator };
