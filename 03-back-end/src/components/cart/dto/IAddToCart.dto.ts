import Ajv from "ajv";

const ajv = new Ajv();

export interface IAddToCartDto {
    itemId: number;
    quantity: number;
}

const AddToCartValidator = ajv.compile({
    type: "object",
    properties: {
        itemId: {
            type: "integer",
        },
        quantity: {
            type: "integer",
            minimum: 1,
        },
    },
    required: [
        "itemId",
        "quantity",
    ],
    additionalProperties: false,
});

export { AddToCartValidator };