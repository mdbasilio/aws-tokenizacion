import { APIGatewayProxyResult } from "aws-lambda"
import { HttpCode } from "../models/enums/HttpCode"


/**
 * Crea una respuesta exitosa con el código de estado 200 y el cuerpo proporcionado.
 *
 * @param {any} body - El cuerpo de la respuesta exitosa.
 * @returns {APIGatewayProxyResult} La respuesta exitosa.
 */
export const successfulResponse = (body: any): APIGatewayProxyResult => {
    return {
        statusCode: HttpCode.OK,
        body: JSON.stringify(body)
    }
}


/**
 * Crea una respuesta de error con el código de estado 500 (Error interno del servidor) y el cuerpo proporcionado.
 *
 * @param {any} body - El cuerpo de la respuesta de error.
 * @returns {APIGatewayProxyResult} La respuesta de error.
 */
export const failedResponse = (body: any): APIGatewayProxyResult => {
    return {
        statusCode: HttpCode.INTERNAL_SERVER_ERROR,
        body: JSON.stringify(body)
    }
}


/**
 * Crea una respuesta controlada con el código de estado y mensaje proporcionados.
 *
 * @param {number} codigoError - El código de estado de la respuesta controlada.
 * @param {any} body - El cuerpo de la respuesta controlada.
 * @returns {APIGatewayProxyResult} La respuesta controlada.
 */
export const controlledResponse = (codigoError: number, body: any): APIGatewayProxyResult => {
    return {
        statusCode: codigoError,
        body: JSON.stringify(body)
    }
}
