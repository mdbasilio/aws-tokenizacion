import * as AWSXRay from 'aws-xray-sdk-core';
import * as AWSXRaySDK from 'aws-xray-sdk';
import cardCredentialsOcp from './card_credentials_ocp';
import { searchItemByField } from '../../data/dynamodb_utils';
import { CardItem } from '../../models/database/CardItem';
import { dataEncryption } from '../../utils/jwe-util';

export const handler = async function (event: any) {
    const segment = AWSXRay.getSegment();

    try {
        const url = '';

        const cardId = event.pathParameters.cardId;

        if (!cardId) {
            return {
                statusCode: 400,
                body: {
                    "responseCode": {
                        "error": 400,
                        "message": "Invalid Request"
                    }
                }
            }
        }

        console.log(`El valor de cardId es: ${cardId}`);

        const paramsOcp = await getTipoYClaveUnica(cardId, segment as AWSXRaySDK.Segment);

        const resOcp = await sendRequestOcp(url, paramsOcp, segment as AWSXRay.Segment);

        if (resOcp.statusCode == 500) {
            console.error("Ocurrió un error en OnPremise");
            return { statusCode: 500 };
        }

        const encryptedData = await dataEncryption(resOcp.body);


        return {
            statusCode: 200,
            headers: { "Content-Type": "text/json" },
            body: {
                "encryptedData": encryptedData
            }
        };
    } catch (error) {
        console.error('Error lambda Card Credentials: ', error);

        return {
            "error": "Unexpected error."
        };
    } finally {
        console.log('Fin Función Card Credentials')
    }
};


enum TipoRegistro {
    TC = 'TC',
    TD = 'TD',
}

const getTipoYClaveUnica = async (cardId: string, segment: AWSXRay.Segment): Promise<{ tipoTarjeta: TipoRegistro, claveUnica: string }> => {
    // Buscar en la primera tabla
    const consumerTc = await consultaTc(cardId, segment);
    if (consumerTc) {
        return { tipoTarjeta: TipoRegistro.TC, claveUnica: consumerTc.ca_tarjeta };
    }

    // Buscar en la segunda tabla
    const consumerTd = await consultaTd(cardId, segment);
    if (consumerTd) {
        return { tipoTarjeta: TipoRegistro.TC, claveUnica: consumerTd.ca_tarjeta };
    }

    // Si no se encuentra en ninguna tabla, lanzar una excepción
    throw new Error('Registro no encontrado en ninguna tabla');
}

const consultaTc = async (cardId: string, segment: AWSXRay.Segment) => {
    return await searchItemByField<CardItem>(process.env.DYNAMODB_TABLE!, 'cardId', cardId, segment);;
}


const consultaTd = async (cardId: string, segment: AWSXRay.Segment) => {
    return await searchItemByField<CardItem>(process.env.DYNAMODB_TABLE!, 'cardId', cardId, segment);;
}


const sendRequestOcp = async (url: string, params: any, segment: AWSXRaySDK.Segment | null) => {
    const subSegment = segment?.addNewSubsegment("hit to openshift");

    const response = await cardCredentialsOcp(url, params);

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