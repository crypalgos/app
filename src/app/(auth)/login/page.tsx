"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle, ArrowRight } from "lucide-react";

import { UserLoginSchema, IUserLoginSchema } from "@/schema/user.schema";
import { AuthActions } from "@/api-actions/auth-actions";
import { useAuthStore } from "@/store/auth-store";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup, Field, FieldLabel, FieldError } from "@/components/ui/field";
import { GoogleLoginButton } from "@/components/google-login-button";
import { BlurFade } from "@/components/ui/auth-animations";

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
      router.push("/strategies");
    } catch (error: any) {
      setGlobalError(error.message || "Invalid credentials. Please try again.");
    }
  };

  return (
    <fieldset disabled={isSubmitting} className="flex flex-col gap-6 w-full max-w-[380px] mx-auto">
      <BlurFade delay={0.1} yOffset={4}>
        <div className="flex flex-col space-y-1.5 text-center md:text-left mb-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground font-medium">
            Enter your credentials to access your workspace
          </p>
        </div>
      </BlurFade>

      {globalError && (
        <BlurFade delay={0.2} yOffset={4}>
          <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive rounded-lg shadow-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2 font-medium text-xs leading-normal">{globalError}</AlertDescription>
          </Alert>
        </BlurFade>
      )}

      <BlurFade delay={0.3} yOffset={4} className="flex flex-col gap-4">
        <GoogleLoginButton />
        
        <div className="relative flex items-center justify-center my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/60"></div>
          </div>
          <span className="relative px-3 text-[10px] uppercase bg-background text-muted-foreground font-semibold tracking-widest z-10">
            Or continue with email
          </span>
        </div>
      </BlurFade>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FieldGroup>
          <BlurFade delay={0.4} yOffset={4}>
            <Field data-invalid={!!errors.identifier}>
              <FieldLabel htmlFor="identifier" className="text-foreground/90 font-medium">Email or Username</FieldLabel>
              <Input
                id="identifier"
                type="text"
                placeholder="name@example.com"
                className="h-10 bg-background dark:bg-white/[0.03] border-zinc-200 dark:border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-md shadow-sm"
                {...register("identifier")}
                aria-invalid={!!errors.identifier}
              />
              <FieldError errors={[errors.identifier]} />
            </Field>
          </BlurFade>

          <BlurFade delay={0.5} yOffset={4}>
            <Field data-invalid={!!errors.password}>
              <div className="flex items-center justify-between w-full">
                <FieldLabel htmlFor="password" className="text-foreground/90 font-medium">Password</FieldLabel>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-medium text-muted-foreground hover:underline hover:text-foreground transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-10 bg-background dark:bg-white/[0.03] border-zinc-200 dark:border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-md shadow-sm"
                {...register("password")}
                aria-invalid={!!errors.password}
              />
              <FieldError errors={[errors.password]} />
            </Field>
          </BlurFade>
        </FieldGroup>

        <BlurFade delay={0.6} yOffset={4}>
          <div className="flex items-center space-x-2 pt-1 pb-2">
            <Checkbox id="remember" className="border-border/60 data-[state=checked]:bg-foreground data-[state=checked]:text-background rounded-[4px]" />
            <label
              htmlFor="remember"
              className="text-[13px] font-medium leading-none text-muted-foreground cursor-pointer select-none"
            >
              Remember for 30 days
            </label>
          </div>
        </BlurFade>

        <BlurFade delay={0.7} yOffset={4}>
          <Button
            type="submit"
            className="w-full h-10 font-medium bg-foreground text-background hover:bg-foreground/90 transition-all rounded-md shadow-sm flex items-center justify-center gap-2 group"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="h-4 w-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </Button>
        </BlurFade>
      </form>

      <BlurFade delay={0.8} yOffset={4}>
        <div className="text-center mt-2">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-foreground hover:text-foreground/80 transition-colors hover:underline"
            >
              Request access
            </Link>
          </p>
        </div>
      </BlurFade>
    </fieldset>
  );
}
