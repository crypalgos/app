import { VerifyForm } from "@/components/auth/verify-form";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Verify Account | CrypAlgos",
  description: "Verify your CrypAlgos account",
};

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyForm />
    </Suspense>
  );
}
