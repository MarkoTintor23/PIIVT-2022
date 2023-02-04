import Ajv from "ajv";
import IServiceData from "../../../common/IServiceData.interface";

const ajv = new Ajv();

export interface IAddManufacturerDto {
    name: string;
}

export default interface IAddManufacturer extends IServiceData {
    name: string;
    category_id: number;
}

const AddManufacturerValidator = ajv.compile({
    type: "object",
    properties: {
        name: {
            type: "string",
            minLength: 4,
            maxLength: 32,
        },
    },
    required: [
        "name",
    ],
    additionalProperties: false,
});

export { AddManufacturerValidator };