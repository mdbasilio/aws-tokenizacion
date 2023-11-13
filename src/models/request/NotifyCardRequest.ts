import * as Joi from 'joi';
import { OperationType } from '../enums/OperationType';
import { OperationStatus } from '../enums/OperationStatus';

export interface NotifyCardRequest {
    operationId: string;
    operation: OperationType;
    digitalCardIds?: string[];
    status: OperationStatus;
}

export const notifyCardRequestSchema = Joi.object({
    operationId: Joi.string()
        .min(1)
        .max(64)
        .pattern(/^[A-Za-z0-9_-]{1,64}$/)
        .required(),

    operation: Joi.string()
        .valid(OperationType.DIGITIZE, OperationType.RENEW)
        .required(),

    digitalCardIds: Joi.array()
        .items(Joi.string())
        .optional(),

    status: Joi.string()
        .valid(OperationStatus.PENDING, OperationStatus.SUCCESSFUL, OperationStatus.FAILED)
        .required(),
});
