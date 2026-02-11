import { RegisterForm } from "@/components/auth/register-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register | CrypAlgos",
  description: "Create a new CrypAlgos account",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
