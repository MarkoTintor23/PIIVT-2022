import Ajv from "ajv";
import IServiceData from "../../../common/IServiceData.interface";

const ajv = new Ajv();

export interface IEditManufacturerDto {
    name: string;
}

export default interface IEditManufacturer extends IServiceData {
    name: string;
}

const EditManufacturerValidator = ajv.compile({
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

export { EditManufacturerValidator };