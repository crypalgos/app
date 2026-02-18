import { BACKEND_URL } from "@/constants";
import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { getCookie } from "cookies-next";


const axiosInstance = axios.create({
    baseURL: BACKEND_URL,
    timeout: 30000,
    withCredentials: true
});

axiosInstance.interceptors.request.use(
    async (request: InternalAxiosRequestConfig) => {
        const token = getCookie("auth_token") as string | null;
        if (token) {
            request.headers.Authorization = `Bearer ${token}`;
        }
        if (!request.data || !(request.data instanceof FormData)) {
            request.headers['Content-Type'] = 'application/json';
        }
        return request;
    },
    
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);


axiosInstance.interceptors.response.use(
    (resposne)=>{
        return resposne;
    },
    (error)=>{
        if(error.response && error.response.data && error.response.data.api_error){
            throw error.response.data.api_error;
        }
        throw error;
    }
    
);

export default axiosInstance;