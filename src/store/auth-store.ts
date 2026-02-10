import { create } from "zustand";
import { setCookie, getCookie, deleteCookie } from "cookies-next/client";


interface AuthStore {
    isAuthenticated: boolean,
    user: IUser | null,
    isLoading: boolean,
    setLogin: (data: ILoginResponse) => void,
    setLogout: () => void,
    setUser: (user: IUser) => void,
    setLoading: (loading: boolean) => void
}

const useAuthStore = create<AuthStore>()(
    (set) => {
        const token = getCookie("auth_token") as string | null;
        return {
            isAuthenticated: !!token,
            user: null,
            isLoading: !!token,
            setLogin: (data: ILoginResponse) => {

                setCookie("auth_token", data.access_token);
                set(() => ({
                    isAuthenticated: true,
                    user: data.user,
                    isLoading: false
                }))
            },
            setLogout: () => {
                deleteCookie("auth_token");
                set(() => ({
                    isAuthenticated: false,
                    user: null,
                    isLoading: false
                }))
            },
            setUser: (user: IUser) => {
                set(() => ({
                    user: user,
                    isLoading: false
                }))
            },
            setLoading: (loading: boolean) => {
                set(() => ({
                    isLoading: loading
                }))
            }
        }
    }
)

export { useAuthStore };

