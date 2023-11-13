import * as Joi from 'joi';

export interface VerifyCardResponse {
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


export const verifyCardResponseSchema = Joi.object({
    cardId: Joi.string()
        .min(1)
        .max(64)
        .pattern(/^[A-Za-z0-9_-]{1,64}$/)
        .required(),

    consumerId: Joi.string()
        .min(1)
        .max(64)
        .pattern(/^[A-Za-z0-9_-]{1,64}$/)
        .required(),

    accountId: Joi.string()
        .min(1)
        .max(64)
        .pattern(/^[A-Za-z0-9_-]{1,64}$/)
        .required(),

    verificationResults: Joi.object({
        securityCode: Joi.object({
            valid: Joi.boolean(),
            verificationAttemptsExceeded: Joi.boolean(),
        })
        .optional(),
        card: Joi.object({
            lostOrStolen: Joi.boolean(),
            expired: Joi.boolean(),
            invalid: Joi.boolean(),
            fraudSuspect: Joi.boolean(),
        })
        .required(),
    }),
});