import { BACKEND_URL } from "@/constants";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { AuthActions } from "@/api-actions/auth-actions";

import { getCookie } from "cookies-next";

const axiosInstance = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000,
  withCredentials: true,
});

import { useAuthStore } from "@/store/auth-store";

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

axiosInstance.interceptors.request.use(
  async (request: InternalAxiosRequestConfig) => {
    const token = getCookie("token");
    if (token) {
      request.headers["Authorization"] = `Bearer ${token}`;
    }

    if (!request.data || !(request.data instanceof FormData)) {
      request.headers["Content-Type"] = "application/json";
    }
    return request;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // RefreshTokenAction will rely on the refresh_token cookie
        const user = await AuthActions.RefreshTokenAction();
        console.log(user);
        useAuthStore.getState().setLogin(user);
        processQueue(null);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear auth store on refresh failure to prevent infinite loops
        useAuthStore.getState().setLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (
      error.response &&
      error.response.data &&
      error.response.data.api_error
    ) {
      throw error.response.data.api_error;
    }
    throw error;
  },
);

export default axiosInstance;
