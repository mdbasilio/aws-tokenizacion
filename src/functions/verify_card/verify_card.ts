import { VerifyCardRequest } from "../../models/request/VerifyCardRequest";
import { verifyCardReqSchema } from "../../models/request/verifyCardReqSchema";
import { VerifyCardResponse } from "../../models/response/VerifyCardResponse";
import { verifyCardResSchema } from "../../models/response/verifyCardResSchema";


export const handler = async (event: any) => {
    try {
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
