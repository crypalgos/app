import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password | CrypAlgos",
  description: "Reset your CrypAlgos account password",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
