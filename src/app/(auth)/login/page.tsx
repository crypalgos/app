import { LoginForm } from "@/components/auth/login-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | CrypAlgos",
  description: "Login to your CrypAlgos account",
};

export default function LoginPage() {
  return <LoginForm />;
}
