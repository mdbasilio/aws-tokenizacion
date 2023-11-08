export interface VerifyCard {
    cardId: string,
    consumerId: string,
    accountId: string,
    verificationResults: VerificationResults,
}


interface VerificationResults {
    securityCode?: SecurityCode,
    card: Card
}

interface SecurityCode {
    valid: boolean,
    verificationAttemptsExceeded: boolean
}

interface Card {
    lostOrStolen: boolean,
    expired: boolean,
    invalid: boolean,
    fraudSuspect: boolean
}