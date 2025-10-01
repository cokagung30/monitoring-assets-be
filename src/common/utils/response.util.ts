import { ApiErrorResponse, ApiSuccessResponse } from "../interfaces/api-response.interface";

export class ResponseUtil {
    static success<T>(data: T, message: string = ''): ApiSuccessResponse<T> {
        return {
            status: 'success',
            message,
            data,
        };
    }

    static error(message: string): ApiErrorResponse {
        return {
            status: 'error',
            message,
            data: null,
        };
    }

    static successWithEmptyArray(message: string = ''): ApiSuccessResponse<any[]> {
        return {
            status: 'success',
            message,
            data: [],
        };
    }

    static successWithEmptyObject(message: string = ''): ApiSuccessResponse<{}> {
        return {
            status: 'success',
            message,
            data: {},
        };
    }
}