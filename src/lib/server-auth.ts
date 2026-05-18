import { cookies } from "next/headers";
import { BACKEND_URL } from "@/constants";

export async function getServerUser(): Promise<IUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return null;
    }

    const response = await fetch(`${BACKEND_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      next: { revalidate: 0 }, // Do not cache, fetch fresh on every request
    });

    if (response.ok) {
      const result = await response.json();
      return result.data as IUser;
    }
  } catch (error) {
    console.error("Error fetching user server-side on refresh:", error);
  }

  return null;
}
