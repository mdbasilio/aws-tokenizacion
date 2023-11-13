import { OperationStatus } from "../enums/OperationStatus";
import { OperationType } from "../enums/OperationType";

export interface NotifyItem {
    operationId: string;
    operation: OperationType;
    digitalCardIds?: string[];
    status: OperationStatus;
}