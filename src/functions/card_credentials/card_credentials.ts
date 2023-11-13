import * as AWSXRay from 'aws-xray-sdk-core';
import * as AWSXRaySDK from 'aws-xray-sdk';
import cardCredentialsOcp from './card_credentials_ocp';
import { dataEncryption } from '../../utils/jwe-util';
import { searchCard } from '../../data/card_util';
import { CardType } from '../../models/enums/CardType';

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

const getTipoYClaveUnica = async (cardId: string, segment: AWSXRay.Segment): Promise<{ cardType: CardType, claveUnica: string }> => {
    // Buscar en la primera tabla
    const consumerTc = await searchCardTc(cardId, segment);
    if (consumerTc) {
        return { cardType: CardType.TC, claveUnica: consumerTc.ca_tarjeta };
    }

    // Buscar en la segunda tabla
    const consumerTd = await searchCardTd(cardId, segment);
    if (consumerTd) {
        return { cardType: CardType.TC, claveUnica: consumerTd.ca_tarjeta };
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