import axiosInstance from "@/lib/axios-interceptor";
import { IUserUpdateSchema } from "@/schema/user.schema";

export const UserActions = {
    GetCurrentUserAction: async (): Promise<IUser> => {
        const response = await axiosInstance.get<ApiResponse<IUser>>("/users/me");
        return response.data.data!;
    },

    UpdateCurrentUserAction: async (data: IUserUpdateSchema): Promise<IUser> => {
        const response = await axiosInstance.put<ApiResponse<IUser>>("/users/me", data);
        return response.data.data!;
    },

    DeleteCurrentUserAction: async (): Promise<IUniversalMessage> => {
        const response = await axiosInstance.delete<ApiResponse<IUniversalMessage>>("/users/me");
        return response.data.data!;
    }
}
