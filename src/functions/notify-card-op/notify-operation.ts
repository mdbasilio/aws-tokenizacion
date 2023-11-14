import * as AWSXRay from 'aws-xray-sdk-core';
import * as AWSXRaySDK from 'aws-xray-sdk';
import { Context, APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { controlledResponse, failedResponse } from '../../utils/generateResponse';
import { searchCard } from '../../data/card_util';
import { createItem } from '../../data/dynamodb_utils';
import { NotifyCardRequest, notifyCardRequestSchema } from '../../models/request/NotifyCardRequest';
import { NotifyItem } from '../../models/database/NotifyItem';
import { HttpCode } from '../../models/enums/HttpCode';
import { CardType } from '../../models/enums/CardType';

/**
 * Objeto usado para mapear errores 400, 404, 500
 */
interface ResponseError {
    error: string
}

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const segment = AWSXRay.getSegment();

    try {
        const cardId = event.pathParameters?.cardId ?? '';
        const table = process.env.DYNAMODB_TABLE!

        if (!cardId) {
            console.error('cardId no está definido en pathParameters');
            const message = "Invalid request path parameters.";

            buildResponse(HttpCode.BAD_REQUEST, message);
        }

        console.log(`El valor de cardId es: ${cardId}`);

        const requestData: NotifyCardRequest = JSON.parse(event.body ?? '');

        // Valida el objeto NotifyCardRequest con el esquema
        const { error: requestError } = notifyCardRequestSchema.validate(requestData);

        if (requestError) {
            // La solicitud no cumple con el esquema
            const message = "Invalid request data.";

            buildResponse(HttpCode.BAD_REQUEST, message);
        }

        const { cardType } = await getCardType(cardId, segment as AWSXRaySDK.Segment);

        let createdNotifyCardOp: NotifyItem | null = null;

        if (cardType == CardType.TC) {
            createdNotifyCardOp = await createNotifyItem(table, null, segment as AWSXRaySDK.Segment);
        }

        if (cardType == CardType.TC) {
            createdNotifyCardOp = await createNotifyItem(table, null, segment as AWSXRaySDK.Segment);
        }

        if (!createdNotifyCardOp) {
            console.log("No se pudo crear el registro");
            const body: ResponseError = {
                error: `Failed to create item ${table}.`
            };
            return failedResponse(body);
        }

        return {
            statusCode: 204,
            headers: { "Content-Type": "text/json" },
            body: ''
        };
    } catch (error) {
        console.error('Error lambda Notify Card Operation: ', error);
        const body: ResponseError = {
            error: "Unexpected error."
        };
        return failedResponse(body);

    } finally {
        console.log('Fin Función Notify Card Operation');
    }
};

const getCardType = async (cardId: string, segment: AWSXRay.Segment): Promise<{ cardType: CardType }> => {
    // Buscar en la primera tabla
    const consumerTc = await searchCardTc(cardId, segment);
    if (consumerTc) {
        return { cardType: CardType.TC };
    }

    // Buscar en la segunda tabla
    const consumerTd = await searchCardTd(cardId, segment);
    if (consumerTd) {
        return { cardType: CardType.TC };
    }

    // Si no se encuentra en ninguna tabla, lanzar una excepción
    throw new Error('Registro no encontrado en ninguna tabla');
}

const searchCardTc = async (cardId: string, segment: AWSXRay.Segment) => {
    return await searchCard(process.env.DYNAMODB_TABLE!, cardId, segment);
}


const searchCardTd = async (cardId: string, segment: AWSXRay.Segment) => {
    return await searchCard(process.env.DYNAMODB_TABLE!, cardId, segment);
}

const createNotifyItem = async (table: string, item: any, segment: AWSXRay.Segment) => {
    return await createItem<NotifyItem>(table, item, segment);
}


const buildResponse = (code: number, message: string) => {
    const payload: ResponseError = {
        error: message
    };
    return controlledResponse(code, payload);
}