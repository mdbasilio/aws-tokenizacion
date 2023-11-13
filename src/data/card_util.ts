import * as AWSXRay from 'aws-xray-sdk';
import { CardItem } from "../models/database/CardItem";
import { searchItemByField } from "./dynamodb_utils";


export const searchCard = async (table: string, cardId: string, segment: AWSXRay.Segment) => {
    return await searchItemByField<CardItem>(table, 'cardId', cardId, segment);;
}