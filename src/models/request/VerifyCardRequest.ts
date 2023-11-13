import * as Joi from 'joi';

export interface VerifyCardRequest {
    cardId: string,
    cardBin: string,
    encryptedData: string,
}

export const verifyCardRequestSchema = Joi.object({
    cardId: Joi.string()
        .min(1)
        .max(64)
        .pattern(/^[A-Za-z0-9_-]{1,48}$/)
        .required(),

    cardBin: Joi.string()
        .min(6)
        .max(6)
        .pattern(/^\d{6}$/)
        .required(),

    encryptedData: Joi.string()
        .max(8192)
        .required(),
});