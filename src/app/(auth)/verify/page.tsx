"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle, ArrowLeft, Mail, RefreshCw, ArrowRight, ShieldCheck } from "lucide-react";
import { useQueryState } from "nuqs";
import { toast } from "sonner";

import { VerifyUserSchema, IVerifyUserSchema } from "@/schema/user.schema";
import { AuthActions } from "@/api-actions/auth-actions";
import { useAuthStore } from "@/store/auth-store";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup, Field, FieldLabel, FieldError } from "@/components/ui/field";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { BlurFade } from "@/components/ui/auth-animations";

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
      router.push("/strategies");
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
    <fieldset disabled={isSubmitting} className="flex flex-col gap-6 w-full max-w-[380px] mx-auto">
      <BlurFade delay={0.1} yOffset={4}>
        <div className="flex flex-col space-y-1.5 text-center md:text-left mb-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Verify account</h1>
          <p className="text-sm text-muted-foreground font-medium">
            Enter the 6-digit code we sent to verify your identity and activate your account.
          </p>

          {identifier && (
            <div className="inline-flex items-center gap-2 mt-4 px-3 py-2 rounded-md bg-secondary/10 border border-border/30 w-fit text-sm text-foreground/80 font-medium mx-auto md:mx-0 shadow-sm transition-all duration-300">
              <Mail className="h-4 w-4 text-primary" />
              <span className="truncate max-w-[240px]">{identifier}</span>
            </div>
          )}
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FieldGroup>
          <BlurFade delay={0.3} yOffset={4}>
            <Field data-invalid={!!errors.verification_code} className="flex flex-col items-center md:items-start">
              <FieldLabel htmlFor="verification_code" className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5 mb-2 self-center md:self-start">
                <ShieldCheck className="size-3.5 text-muted-foreground" />
                6-Digit Verification Code
              </FieldLabel>
              <div className="flex justify-center md:justify-start w-full">
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
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} className="size-11 text-base font-bold bg-background dark:bg-white/[0.03] border-zinc-200 dark:border-border/50" />
                          <InputOTPSlot index={1} className="size-11 text-base font-bold bg-background dark:bg-white/[0.03] border-zinc-200 dark:border-border/50" />
                          <InputOTPSlot index={2} className="size-11 text-base font-bold bg-background dark:bg-white/[0.03] border-zinc-200 dark:border-border/50" />
                        </InputOTPGroup>
                        <InputOTPSeparator className="mx-1 text-muted-foreground/60 scale-125" />
                        <InputOTPGroup>
                          <InputOTPSlot index={3} className="size-11 text-base font-bold bg-background dark:bg-white/[0.03] border-zinc-200 dark:border-border/50" />
                          <InputOTPSlot index={4} className="size-11 text-base font-bold bg-background dark:bg-white/[0.03] border-zinc-200 dark:border-border/50" />
                          <InputOTPSlot index={5} className="size-11 text-base font-bold bg-background dark:bg-white/[0.03] border-zinc-200 dark:border-border/50" />
                        </InputOTPGroup>
                      </InputOTP>
                  )}
                />
              </div>
              <FieldError errors={[errors.verification_code]} />
            </Field>
          </BlurFade>
        </FieldGroup>

        <BlurFade delay={0.4} yOffset={4}>
          <Button
            type="submit"
            className="w-full h-10 font-medium bg-foreground text-background hover:bg-foreground/90 transition-all rounded-md shadow-sm mt-2 flex items-center justify-center gap-2 group"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Verify
                <ArrowRight className="h-4 w-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </Button>
        </BlurFade>
      </form>

      <BlurFade delay={0.5} yOffset={4}>
        <div className="flex flex-col items-center gap-4 mt-2">
          <div className="text-sm text-center">
            <span className="text-muted-foreground">Didn&apos;t receive the code? </span>
            {countdown > 0 ? (
              <span className="font-semibold text-foreground/80">Resend in {countdown}s</span>
            ) : (
              <button
                onClick={handleResend}
                disabled={isResending}
                className="font-medium text-foreground hover:text-foreground/80 transition-colors inline-flex items-center gap-1 hover:underline cursor-pointer"
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
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to login
          </Link>
        </div>
      </BlurFade>
    </fieldset>
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
