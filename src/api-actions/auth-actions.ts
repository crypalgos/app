import axiosInstance from "@/lib/axios-interceptor";
import {
    IUserLoginSchema,
    IUserRegistrationSchema,
    IVerifyUserSchema,
    ICheckVerificationCodeSchema,
    IForgotPasswordSchema,
    IResetPasswordSchema,
    IResendVerificationSchema,
    ICheckUsernameAvailabilitySchema
} from "@/schema/user.schema";

export const AuthActions = {
    RegisterAction: async (data: IUserRegistrationSchema): Promise<IRegisterUserResponse> => {
        const response = await axiosInstance.post<ApiResponse<IRegisterUserResponse>>("/auth/register", data);
        return response.data.data;
    },

    CheckUsernameAvailabilityAction: async (data: ICheckUsernameAvailabilitySchema): Promise<ICheckUsernameAvailabilityResponse> => {
        const response = await axiosInstance.post<ApiResponse<ICheckUsernameAvailabilityResponse>>("/auth/check-username", data);
        return response.data.data;
    },

    LoginAction: async (data: IUserLoginSchema): Promise<ILoginResponse> => {
        const response = await axiosInstance.post<ApiResponse<ILoginResponse>>("/auth/login", data);
        return response.data.data;
    },

    VerifyUserAction: async (data: IVerifyUserSchema): Promise<IVerifyUserResponse> => {
        const response = await axiosInstance.post<ApiResponse<IVerifyUserResponse>>("/auth/verify", data);
        return response.data.data;
    },

    CheckVerificationCodeAction: async (data: ICheckVerificationCodeSchema): Promise<IUniversalMessage> => {
        const response = await axiosInstance.post<ApiResponse<IUniversalMessage>>("/auth/check-verification-code", data);
        return response.data.data;
    },

    RefreshTokenAction: async (): Promise<IRefreshTokenResponse> => {
        const response = await axiosInstance.post<ApiResponse<IRefreshTokenResponse>>("/auth/refresh");
        return response.data.data;
    },

    ForgotPasswordAction: async (data: IForgotPasswordSchema): Promise<IUniversalMessage> => {
        const response = await axiosInstance.post<ApiResponse<IUniversalMessage>>("/auth/forgot-password", data);
        return response.data.data;
    },

    ResetPasswordAction: async (data: IResetPasswordSchema): Promise<IUniversalMessage> => {
        const response = await axiosInstance.post<ApiResponse<IUniversalMessage>>("/auth/reset-password", data);
        return response.data.data;
    },

    ResendVerificationAction: async (data: IResendVerificationSchema): Promise<IUniversalMessage> => {
        const response = await axiosInstance.post<ApiResponse<IUniversalMessage>>("/auth/resend-verification", data);
        return response.data.data;
    },

    LogoutAction: async (): Promise<IUniversalMessage> => {
        const response = await axiosInstance.post<ApiResponse<IUniversalMessage>>("/auth/logout");
        return response.data.data;
    }
}