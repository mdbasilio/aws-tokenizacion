import * as AWSXRay from 'aws-xray-sdk-core';
import * as AWSXRaySDK from 'aws-xray-sdk';
import { ValidCard } from "../../models/request/VerifyCardOcpRequest";
import { VerifyCardRequest } from "../../models/request/VerifyCardRequest";
import { verifyCardReqSchema } from "../../models/request/verifyCardReqSchema";
import { VerifyCardResponse } from "../../models/response/VerifyCardResponse";
import { verifyCardResSchema } from "../../models/response/verifyCardResSchema";
import { dataDecryption } from "../../utils/jwe-util";
import verifyCardOcp from "./verify_card_ocp";
import { createItem } from '../../data/dynamodb_utils';
import { CardItem } from '../../models/database/CardItem';


export const handler = async (event: any) => {
    const segment = AWSXRay.getSegment();

    try {
        const table = process.env.DYNAMODB_TABLE!;
        const url_verify = process.env.TRCM_VERIFY_CARD!;

        // Parsea el cuerpo de la solicitud como un objeto VerifyCardRequest
        const requestData: VerifyCardRequest = JSON.parse(event.body || '');

        // Valida el objeto VerifyCardRequest con el esquema
        const { error: requestError, value: validRequestData } = verifyCardReqSchema.validate(requestData);

        if (requestError) {
            // La solicitud no cumple con el esquema
            const errorResponse = {
                responseCode: {
                    error: 400,
                    message: 'Invalid request data',
                },
            };

            return {
                statusCode: 400,
                body: JSON.stringify(errorResponse),
            };
        }

        const { encryptedData } = requestData;

        const dataCard: ValidCard = await dataDecryption(encryptedData);

        const reqOcp = {
            cardId: requestData.cardId,
            cardBin: requestData.cardBin,
            ...dataCard
        }

        const resOcp = await sendRequestOcp(url_verify, reqOcp, segment as AWSXRaySDK.Segment);

        if(resOcp.statusCode == 500) {
            console.log("Ocurrió un error en On-Premise");
            return {
                statusCode: 500
            };
        }

        const createdConsumerInfo = await createItem<CardItem>(table, resOcp.body, segment as AWSXRaySDK.Segment);

        if (!createdConsumerInfo) {
            console.log("No se pudo crear el registro");
            return {
                statusCode: 500
            };
        }

        // Procesa la solicitud y crea una respuesta 
        const response: VerifyCardResponse = {
            cardId: 'validCardId',
            consumerId: 'validConsumerId',
            accountId: 'validAccountId',
            verificationResults: {
                securityCode: {
                    valid: true,
                    verificationAttemptsExceeded: false,
                },
                card: {
                    lostOrStolen: false,
                    expired: false,
                    invalid: false,
                    fraudSuspect: false,
                },
            },
        };

        // Valida la respuesta con el esquema
        const { error: responseError } = verifyCardResSchema.validate(response);

        if (responseError) {
            // La respuesta generada no cumple con el esquema
            const errorResponse = {
                responseCode: {
                    error: 400,
                    message: 'Invalid response data',
                },
            };

            return {
                statusCode: 400,
                body: JSON.stringify(errorResponse),
            };
        }

        // La solicitud y la respuesta son válidas, devuelve la respuesta
        return {
            statusCode: 200,
            body: JSON.stringify(response),
        };
    } catch (error) {

        return {
            statusCode: 500
        };
    }

};


const sendRequestOcp = async (url: string, request: any, segment: AWSXRaySDK.Segment | null) => {
    const subSegment = segment?.addNewSubsegment("hit to openshift");

    const response = await verifyCardOcp(url, request);

    if (!response) {
        return {
            statusCode: 500,
        };
    }

    subSegment?.close();

    return {
        statusCode: 200,
        body: response,
    };
}