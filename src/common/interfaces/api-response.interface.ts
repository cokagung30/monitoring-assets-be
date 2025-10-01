export interface ApiResponse<T = any>{
    status: 'success' | 'error',
    message: string,
    data: T,
}

export interface ApiSuccessResponse<T = any> extends ApiResponse<T> {
    status: 'success';
}

export interface ApiErrorResponse extends ApiResponse<null> {
    status: 'error';
    data: null;
}