import axiosInstance from "@/lib/axios-interceptor";

export const SessionActions = {
    GetUserSessionsAction: async (): Promise<ISessionResponse> => {
        const response = await axiosInstance.get<ApiResponse<ISessionResponse>>("/sessions");
        return response.data.data;
    },

    DeleteAllSessionsAction: async (): Promise<IUniversalMessage> => {
        const response = await axiosInstance.delete<ApiResponse<IUniversalMessage>>("/sessions");
        return response.data.data;
    },

    DeleteSessionAction: async (sessionId: string): Promise<IUniversalMessage> => {
        const response = await axiosInstance.delete<ApiResponse<IUniversalMessage>>(`/sessions/${sessionId}`);
        return response.data.data;
    }
}
