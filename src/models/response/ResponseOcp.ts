import { HttpCode } from "../enums/HttpCode";

export interface ResponseOcp<T> {
    status: HttpCode;
    message: string;
    data: T;
}