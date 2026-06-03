"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle, ArrowLeft, Mail, RefreshCw } from "lucide-react";
import { useQueryState } from "nuqs";
import { toast } from "sonner";

import { VerifyUserSchema, IVerifyUserSchema } from "@/schema/user.schema";
import { AuthActions } from "@/api-actions/auth-actions";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { useAuthStore } from "@/store/auth-store";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";

const RESEND_COOLDOWN = 60; // 60 seconds

function VerifyPage() {
  const router = useRouter();
  const [identifier] = useQueryState("identifier", { defaultValue: "" });
  const [globalError, setGlobalError] = useState<string | null>(null);
  const setLogin = useAuthStore((state) => state.setLogin);
  
  // Resend Countdown State
  const [countdown, setCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IVerifyUserSchema>({
    resolver: zodResolver(VerifyUserSchema),
    defaultValues: {
      identifier: identifier || "",
      verification_code: "",
    },
  });

  const onSubmit = async (data: IVerifyUserSchema) => {
    setGlobalError(null);
    try {
      const response = await AuthActions.VerifyUserAction({
        identifier: data.identifier || identifier,
        verification_code: data.verification_code
      });
      setLogin(response);
      toast.success("Account verified successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      const errorMsg = error.message || "Verification failed. Please try again.";
      setGlobalError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleResend = async () => {
    const activeIdentifier = identifier;
    if (!activeIdentifier) {
      toast.error("User identifier not found. Please try logging in again.");
      return;
    }

    setIsResending(true);
    try {
      await AuthActions.ResendVerificationAction({ identifier: activeIdentifier });
      toast.success("Verification code resent successfully!");
      setCountdown(RESEND_COOLDOWN);
    } catch (error: any) {
      toast.error(error.message || "Failed to resend code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 mt-8 md:mt-0">
      <div className="flex flex-col space-y-3 text-center md:text-left mb-2">
        <h1 className="text-3xl font-semibold tracking-tight">Verify account</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Enter the 6-digit code we sent to verify your identity and activate your account.
        </p>

        {identifier && (
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-fit text-sm text-foreground/80 font-medium mx-auto md:mx-0 shadow-sm transition-all duration-300">
            <Mail className="h-4 w-4 text-primary" />
            <span className="truncate max-w-[240px]">{identifier}</span>
          </div>
        )}
      </div>

      {globalError && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2 font-medium">{globalError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FieldGroup>
          <Field data-invalid={!!errors.verification_code} className="flex flex-col items-center md:items-start">
            <FieldLabel htmlFor="verification_code" className="text-foreground/80 mb-1 text-sm font-medium self-center md:self-start">
              Verification Code
            </FieldLabel>
            <div className="flex justify-center w-full">
              <Controller
                control={control}
                name="verification_code"
                render={({ field }) => (
                    <InputOTP
                      id="verification_code"
                      maxLength={6}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                      className="focus:ring-2 focus:ring-primary"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="w-12 h-12 text-lg md:w-14 md:h-14 font-semibold border-zinc-200 dark:border-muted/80 bg-background dark:bg-white/5" />
                        <InputOTPSlot index={1} className="w-12 h-12 text-lg md:w-14 md:h-14 font-semibold border-zinc-200 dark:border-muted/80 bg-background dark:bg-white/5" />
                        <InputOTPSlot index={2} className="w-12 h-12 text-lg md:w-14 md:h-14 font-semibold border-zinc-200 dark:border-muted/80 bg-background dark:bg-white/5" />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} className="w-12 h-12 text-lg md:w-14 md:h-14 font-semibold border-zinc-200 dark:border-muted/80 bg-background dark:bg-white/5" />
                        <InputOTPSlot index={4} className="w-12 h-12 text-lg md:w-14 md:h-14 font-semibold border-zinc-200 dark:border-muted/80 bg-background dark:bg-white/5" />
                        <InputOTPSlot index={5} className="w-12 h-12 text-lg md:w-14 md:h-14 font-semibold border-zinc-200 dark:border-muted/80 bg-background dark:bg-white/5" />
                      </InputOTPGroup>
                    </InputOTP>
                )}
              />
            </div>
            {errors.verification_code && (
              <span className="text-xs text-destructive font-semibold mt-2 block text-center md:text-left w-full">
                {errors.verification_code.message || "Please enter a valid 6-digit code."}
              </span>
            )}
          </Field>
        </FieldGroup>

        <Button
          type="submit"
          className="w-full h-12 font-medium bg-foreground text-background hover:bg-foreground/90 transition-all rounded-lg shadow-md hover:shadow-lg mt-2 text-base"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify"
          )}
        </Button>
      </form>

      <div className="flex flex-col items-center gap-4 mt-2">
        <div className="text-sm text-center">
          <span className="text-muted-foreground">Didn&apos;t receive the code? </span>
          {countdown > 0 ? (
            <span className="font-semibold text-foreground/80">Resend in {countdown}s</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={isResending}
              className="font-semibold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1 hover:underline cursor-pointer"
            >
              {isResending ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Resend code"
              )}
            </button>
          )}
        </div>

        <Link
          href="/login"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group mt-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to login
        </Link>
      </div>
    </div>
  );
}

export default function VerifyPageWithSuspense() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center p-6 space-y-4 w-full min-h-[300px]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground animate-pulse font-medium">Loading verification portal...</p>
      </div>
    }>
      <VerifyPage />
    </Suspense>
  );
}
