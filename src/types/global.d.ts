interface ApiResponse<T> {
    localDate: string,
    data?: T,
    apiError: ApiError
} 

interface ApiError {
    status_code : number,
    message : string,
    errors : Record <String, string>,
}

interface IUniversalMessage {
    message: string
}
