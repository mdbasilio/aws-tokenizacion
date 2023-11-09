import * as AWSXRay from 'aws-xray-sdk-core';
import * as AWSXRaySDK from 'aws-xray-sdk';

export const handler = async function (event: any) {
    const segment = AWSXRay.getSegment();

    try {
        return {
            statusCode: 200,
            headers: { "Content-Type": "text/json" },
            body: JSON.stringify({ message: "Hello from Lambda card_credentials!" })
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