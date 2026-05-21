"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle, ShieldAlert } from "lucide-react";

import { UserLoginSchema, IUserLoginSchema } from "@/schema/user.schema";
import { AuthActions } from "@/api-actions/auth-actions";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup, Field, FieldLabel, FieldError } from "@/components/ui/field";

import { useAuthStore } from "@/store/auth-store";
import { GoogleLoginButton } from "@/components/google-login-button";

/**
 * Admin-only login page.
 * This route (/admin/login) is intentionally excluded from the waitlist-mode
 * middleware redirect so the administrator can always access the platform.
 * It is not linked from any public navigation — discoverable only via the
 * "Are you the administrator?" link on the waitlist page.
 */
export default function AdminLoginPage() {
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
      router.push("/dashboard");
    } catch (error: any) {
      setGlobalError(
        error?.response?.data?.message || "Invalid credentials. Please try again."
      );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Admin badge */}
      <div className="flex flex-col space-y-2 text-center md:text-left mb-4">
        <div className="inline-flex items-center gap-1.5 self-center md:self-start px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-600 dark:text-amber-400 tracking-wide mb-1">
          <ShieldAlert className="size-3" />
          Administrator Access
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Enter your administrator credentials to access the platform.
        </p>
      </div>

      {globalError && (
        <Alert
          variant="destructive"
          className="bg-destructive/10 border-destructive/20 text-destructive rounded-xl"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2 font-medium">{globalError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-4">
        <GoogleLoginButton />

        <div className="relative flex items-center justify-center my-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50" />
          </div>
          <span className="relative px-3 text-[10px] uppercase bg-background text-muted-foreground font-bold tracking-wider z-10">
            Or continue with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FieldGroup>
          <Field data-invalid={!!errors.identifier}>
            <FieldLabel htmlFor="identifier" className="text-foreground/80">
              Email or Username
            </FieldLabel>
            <Input
              id="identifier"
              type="text"
              placeholder="name@example.com or username"
              className="h-11 bg-background dark:bg-white/5 border-zinc-200 dark:border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all"
              {...register("identifier")}
              aria-invalid={!!errors.identifier}
              disabled={isSubmitting}
            />
            <FieldError errors={[errors.identifier]} />
          </Field>

          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password" className="text-foreground/80">
              Password
            </FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="h-11 bg-background dark:bg-white/5 border-zinc-200 dark:border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all"
              {...register("password")}
              aria-invalid={!!errors.password}
              disabled={isSubmitting}
            />
            <FieldError errors={[errors.password]} />
          </Field>
        </FieldGroup>

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
        <Link
          href="/waitlist"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to waitlist
        </Link>
      </div>
    </div>
  );
}
