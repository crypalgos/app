"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle } from "lucide-react";

import { UserLoginSchema, IUserLoginSchema } from "@/schema/user.schema";
import { AuthActions } from "@/api-actions/auth-actions";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup, Field, FieldLabel, FieldError } from "@/components/ui/field";

import { useAuthStore } from "@/store/auth-store";
import { GoogleLoginButton } from "@/components/google-login-button";


export default function LoginPage() {
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const setLogin = useAuthStore((state) => state.setLogin);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IUserLoginSchema>({
    resolver: zodResolver(UserLoginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = async (data: IUserLoginSchema) => {
    setGlobalError(null);
    try {
      const response = await AuthActions.LoginAction(data);
      setLogin(response);
      router.push("/dashboard"); // Redirect to dashboard or appropriate route
    } catch (error: any) {
      setGlobalError(
        error?.response?.data?.message || "Invalid credentials. Please try again."
      );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col space-y-2 text-center md:text-left mb-4">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to access your workspace
        </p>
      </div>

      {globalError && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2 font-medium">{globalError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-4">
        <GoogleLoginButton />
        
        <div className="relative flex items-center justify-center my-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50"></div>
          </div>
          <span className="relative px-3 text-[10px] uppercase bg-background text-muted-foreground font-bold tracking-wider z-10">
            Or continue with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FieldGroup>
          <Field data-invalid={!!errors.identifier}>
            <FieldLabel htmlFor="identifier" className="text-foreground/80">Email or Username</FieldLabel>
            <Input
              id="identifier"
              type="text"
              placeholder="name@example.com or username"
              className="h-11 bg-black/5 dark:bg-white/5 border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all"
              {...register("identifier")}
              aria-invalid={!!errors.identifier}
              disabled={isSubmitting}
            />
            <FieldError errors={[errors.identifier]} />
          </Field>

          <Field data-invalid={!!errors.password}>
            <div className="flex items-center justify-between w-full">
              <FieldLabel htmlFor="password" className="text-foreground/80">Password</FieldLabel>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary hover:underline hover:text-primary/80 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="h-11 bg-black/5 dark:bg-white/5 border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all"
              {...register("password")}
              aria-invalid={!!errors.password}
              disabled={isSubmitting}
            />
            <FieldError errors={[errors.password]} />
          </Field>
        </FieldGroup>

        <div className="flex items-center space-x-2 pt-1 pb-3">
          <Checkbox id="remember" className="border-border/60 data-[state=checked]:bg-primary" />
          <label
            htmlFor="remember"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground cursor-pointer"
          >
            Remember for 30 days
          </label>
        </div>

        <Button
          type="submit"
          className="w-full h-11 font-medium bg-foreground text-background hover:bg-foreground/90 transition-all rounded-lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Authenticating...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      <div className="text-center mt-4">


        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-foreground hover:text-primary transition-colors hover:underline"
          >
            Request access
          </Link>
        </p>
      </div>
    </div>
  );
}
