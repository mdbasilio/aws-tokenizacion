import * as AWSXRay from 'aws-xray-sdk-core';
import * as AWSXRaySDK from 'aws-xray-sdk';
import { ValidCard } from "../../models/request/VerifyCardOcpRequest";
import { VerifyCardRequest, verifyCardRequestSchema } from "../../models/request/VerifyCardRequest";
import { VerifyCardResponse, verifyCardResponseSchema } from "../../models/response/VerifyCardResponse";
import { dataDecryption } from "../../utils/jwe-util";
import verifyCardOcp from "./verify_card_ocp";
import { createItem } from '../../data/dynamodb_utils';
import { CardItem } from '../../models/database/CardItem';
import { CardType } from '../../models/enums/CardType';
import { VerifyCardOcpResponse } from '../../models/response/VerifyCardOcpResponse';
import { ConsumerItem } from '../../models/database/ConsumerItem';


export const handler = async (event: any) => {
    const segment = AWSXRay.getSegment();

    try {
        const table = process.env.DYNAMODB_TABLE!;
        const url_verify = process.env.TRCM_VERIFY_CARD!;

        // Parsea el cuerpo de la solicitud como un objeto VerifyCardRequest
        const requestData: VerifyCardRequest = JSON.parse(event.body || '');

        // Valida el objeto VerifyCardRequest con el esquema
        const { error: requestError } = verifyCardRequestSchema.validate(requestData);

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
            cardBin: requestData.cardBin,
            ...dataCard
        }

        const resOcp = await sendRequestOcp(url_verify, reqOcp, segment as AWSXRaySDK.Segment);

        if (resOcp.statusCode == 500) {
            console.log("Ocurrió un error en On-Premise");
            return {
                statusCode: 500
            };
        }

        let result: VerifyCardOcpResponse = resOcp?.body;

        const { datosCliente, tipoTarjeta, consumerId, accountId, card } = result.data;

        const cardId = requestData.cardId;

        const card_db: CardItem = {
            cardId,
            ca_bin: requestData.cardBin,
            ca_consumer_id: consumerId,
            ca_cuenta: accountId,
            ca_tarjeta: '',
            ca_fecha_act: '',
            ca_fecha_ing: ''
        }

        const client_db: ConsumerItem = {
            consumerId,
            cardId,
            firstName: datosCliente.nombreCliente,
            lastName: datosCliente.apellidoCliente,
            dateOfBirth: datosCliente.fechaNacimiento,
            title: datosCliente.title,
            email: datosCliente.email,
            line1: datosCliente.direccion,
            city: datosCliente.ciudad,
            countryCode: datosCliente.pais,
            zipCode: '',
            phoneNumber: datosCliente.celular
        };

        let createdCard: CardItem | null = null;
        let createdConsumerInfo: ConsumerItem | null = null;

        if (tipoTarjeta == CardType.TC) {
            createdCard = await createItem<CardItem>(table, card_db, segment as AWSXRaySDK.Segment);
            createdConsumerInfo = await createItem<ConsumerItem>(table, client_db, segment as AWSXRaySDK.Segment);
        }

        if (tipoTarjeta == CardType.TD) {
            createdCard = await createItem<CardItem>(table, card_db, segment as AWSXRaySDK.Segment);
            createdConsumerInfo = await createItem<ConsumerItem>(table, client_db, segment as AWSXRaySDK.Segment);
        }

        if (!createdConsumerInfo && !createdCard) {
            console.log("No se pudo crear el registro");
            return {
                statusCode: 500
            };
        }

        // Procesa la solicitud y crea una respuesta 
        const response: VerifyCardResponse = {
            cardId: requestData.cardId,
            consumerId,
            accountId,
            verificationResults: {
                card
            },
        };

        // Valida la respuesta con el esquema
        const { error: responseError } = verifyCardResponseSchema.validate(response);

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