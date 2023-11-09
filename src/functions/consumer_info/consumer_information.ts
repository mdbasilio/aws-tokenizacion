import * as AWSXRay from 'aws-xray-sdk-core';
import * as AWSXRaySDK from 'aws-xray-sdk';
import { searchItemByField } from '../../data/dynamodb_utils';
import { ConsumerInformation } from '../../models/response/ConsumerInformation';


export const handler = async function (event: any) {
    const segment = AWSXRay.getSegment();

    try {
        console.log('Inicio Función Consumer Information');

        const table = process.env.DYNAMODB_TABLE!;

        const consumerId = event.pathParameters.consumerId;

        console.log(`El valor de consumerId es: ${consumerId}`);

        const consumer = await searchItemByField<ConsumerInformation>(table, 'consumerId', consumerId, segment as AWSXRaySDK.Segment);

        if (!consumer) {
            const message = 'El registro no fue encontrado.';
            return {
                "error": message
            };
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "text/json" },
            body: JSON.stringify(consumer)
        };
    } catch (error) {
        console.error('Error lambda Consumer Information: ', error);

        return {
            "error": "Unexpected error."
        };
    } finally {
        console.log('Fin Función Consumer Information')
    }

}