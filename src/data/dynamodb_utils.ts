import * as AWS_DynamoDBDocumentClient from "@aws-sdk/lib-dynamodb";

const {
    DynamoDBDocument
} = AWS_DynamoDBDocumentClient;

import { DynamoDB } from "@aws-sdk/client-dynamodb";
import * as AWSXRaySDK from 'aws-xray-sdk';

const documentClient = DynamoDBDocument.from(new DynamoDB());


/**
 * Crea un nuevo elemento en una tabla de DynamoDB.
 *
 * @template T - El tipo del elemento que se está creando.
 * @param {string} table - El nombre de la tabla en la que se va a crear el elemento.
 * @param {any} item - El elemento que se va a crear en la tabla.
 * @param {AWSXRaySDK.Segment} segment - El segmento de AWS X-Ray para la trazabilidad.
 * @returns {Promise<T | null>} - Una promesa que se resuelve con el elemento creado o null en caso de error.
 * @author Mario Basilio (iRoute)
*/
export async function createItem<T>(
    table: string,
    item: any,
    segment: AWSXRaySDK.Segment
): Promise<T | null> {
    const subsegment = segment?.addNewSubsegment(`Hit to DynamoDB ${table}`);

    try {
        const params: AWS_DynamoDBDocumentClient.PutCommandInput = {
            TableName: table,
            Item: item,
        };

        await documentClient.put(params);
        const result = params.Item as T;

        return result;
    } catch (error) {
        console.error('Error al crear el registro: ', error);
        subsegment?.addError(JSON.stringify(error));
        return null;
    } finally {
        subsegment?.close();
    }
}


/**
 * Busca un elemento en una tabla de DynamoDB por un campo específico.
 *
 * @template T - El tipo del elemento que se está buscando.
 * @param {string} table - El nombre de la tabla en la que se va a realizar la búsqueda.
 * @param {string} fieldName - El nombre del campo por el cual se realizará la búsqueda.
 * @param {string} fieldValue - El valor del campo por el cual se realizará la búsqueda.
 * @param {AWSXRaySDK.Segment} segment - El segmento de AWS X-Ray para la trazabilidad.
 * @returns {Promise<T | null>} - Una promesa que se resuelve con el elemento encontrado o null si no se encuentra.
 * @author Mario Basilio (iRoute)
*/
export async function searchItemByField<T>(
    table: string,
    fieldName: string,
    fieldValue: string,
    segment: AWSXRaySDK.Segment
): Promise<T | null> {
    const subsegment = segment?.addNewSubsegment(`Hit to DynamoDB search ${table}`);

    const params: AWS_DynamoDBDocumentClient.GetCommandInput = {
        TableName: table,
        Key: {
            [fieldName]: fieldValue,
        },
    };

    try {
        const response = await documentClient.get(params);
        const data = response.Item as T;
        return data || null;
    } catch (error) {
        console.error(`Error al buscar el registro por ${fieldName}:`, error);
        subsegment?.addError(JSON.stringify(error));
        return null;
    } finally {
        subsegment?.close();
    }
}
