import { ResponseOcp } from "./ResponseOcp";


export interface CardCredentialsOcp extends ResponseOcp<ValidCard> {
    //metadata?: any;
}

interface ValidCard {
    pan: string,
    exp: string,
    name: string,
    cvv?: string,
}