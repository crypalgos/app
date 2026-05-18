interface IUser {
    id: string,
    name: string,
    email: string,
    username: string,
    country_code: number,
    phone: string,
    is_verified: boolean,
    created_at: string,
    updated_at: string
}

interface IRegisterUserResponse {
    user: IUser,
    message: string
}

interface ICheckUsernameAvailabilityResponse {
    available: boolean,
    username: string,
    message: string
}

interface ILoginResponse {
    user: IUser,
    access_token: string,
    message: string
}

interface IVerifyUserResponse {
    user: IUser,
    access_token: string,
    message: string
}

interface IRefreshTokenResponse {
    user: IUser,
    access_token: string,
    message: string
}