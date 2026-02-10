import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Reset Password | CrypAlgos",
  description: "Reset your CrypAlgos account password",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
