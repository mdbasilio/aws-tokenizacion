export interface VerifyCardOcpRequest {
    cardId: string,
    cardBin: string,
    pan: string,
    exp: string,
    name?: string,
    cvv?: string,
}

export interface ValidCard {
    pan: string,
    exp: string,
    name?: string,
    cvv?: string,
}