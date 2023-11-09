export interface VerifyCardRequest {
    cardId: string,
    cardBin: string,
    encryptedData: string,
}