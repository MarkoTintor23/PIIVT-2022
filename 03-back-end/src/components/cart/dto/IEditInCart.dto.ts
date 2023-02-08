import Ajv from "ajv";

const ajv = new Ajv();

export interface IEditInCartDto {
    itemId: number;
    quantity: number;
}

const EditInCartValidator = ajv.compile({
    type: "object",
    properties: {
        itemId: {
            type: "integer",
        },
        quantity: {
            type: "integer",
            minimum: 0,
        },
    },
    required: [
        "itemId",
        "quantity",
    ],
    additionalProperties: false,
});

export { EditInCartValidator };