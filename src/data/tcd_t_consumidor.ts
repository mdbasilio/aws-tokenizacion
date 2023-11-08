import * as AWS_DynamoDBDocumentClient from "@aws-sdk/lib-dynamodb";

const {
    DynamoDBDocument
} = AWS_DynamoDBDocumentClient;

import { DynamoDB } from "@aws-sdk/client-dynamodb";
import * as xray from 'aws-xray-sdk';

const documentClient = DynamoDBDocument.from(new DynamoDB());


export async function createItemConsumerInfo(table: string, item: any, segment: xray.Segment): Promise<any | null> {
    const subsegment = segment?.addNewSubsegment(`Hit to DynamoDB ${table}`);

    try {
        const params: AWS_DynamoDBDocumentClient.PutCommandInput = {
            TableName: table,
            Item: item,
        };

        await documentClient.put(params);
        const result = params.Item;

        return result;
    } catch (error) {
        console.error('Error al crear el registro:', error);
        subsegment?.addError(JSON.stringify(error));
        return null;
    } finally {
        subsegment?.close();
    }
}