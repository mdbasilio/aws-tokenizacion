import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import * as AWSXRay from 'aws-xray-sdk-core';
import * as AWSXRaySDK from 'aws-xray-sdk';

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const segment = AWSXRay.getSegment();
    
    return {
        statusCode: 200,
        headers: { "Content-Type": "text/json" },
        body: JSON.stringify({ message: "Hello from Lambda deliver_otp!" })
    };
};