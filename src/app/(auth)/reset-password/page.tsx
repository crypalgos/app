"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Loader2, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Check, 
  Lock, 
  KeyRound, 
  ShieldCheck 
} from "lucide-react";
import { useQueryState } from "nuqs";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { AuthActions } from "@/api-actions/auth-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup, Field, FieldLabel, FieldError } from "@/components/ui/field";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { Badge } from "@/components/ui/badge";
import { BlurFade } from "@/components/ui/auth-animations";

// Premium form schema with password match validation on the frontend
const ResetPasswordFormSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  verification_code: z.string().length(6, "Verification code must be exactly 6 digits"),
  new_password: z.string().min(8, "Password must be at least 8 characters long"),
  confirm_password: z.string().min(8, "Confirm password must be at least 8 characters long"),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

type IResetPasswordForm = z.infer<typeof ResetPasswordFormSchema>;

// Password strength evaluator mapping to premium semantic styles
const getPasswordStrength = (pwd: string) => {
  if (!pwd) return { score: 0, text: "", color: "bg-muted", variant: "secondary" as const };
  if (pwd.length < 8) return { score: 1, text: "Weak", color: "bg-destructive", variant: "destructive" as const };
  
  const hasUppercase = /[A-Z]/.test(pwd);
  const hasLowercase = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  
  const criteriaCount = [hasUppercase && hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;
  if (criteriaCount === 1) return { score: 2, text: "Fair", color: "bg-destructive/60", variant: "destructive" as const };
  if (criteriaCount === 3) return { score: 4, text: "Strong", color: "bg-primary", variant: "default" as const };
  return { score: 3, text: "Good", color: "bg-primary/60", variant: "secondary" as const };
};

function ResetPasswordPage() {
  const router = useRouter();
  const [identifier] = useQueryState("identifier", { defaultValue: "" });
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [checkingCode, setCheckingCode] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<IResetPasswordForm>({
    resolver: zodResolver(ResetPasswordFormSchema),
    defaultValues: {
      identifier: identifier || "",
      verification_code: "",
      new_password: "",
      confirm_password: "",
    },
    mode: "onChange",
  });

  const passwordVal = watch("new_password") || "";
  const confirmPasswordVal = watch("confirm_password") || "";
  const strength = getPasswordStrength(passwordVal);

  const handleNextStep = async () => {
    const isOtpValid = await trigger("verification_code");
    if (!isOtpValid) return;

    setCheckingCode(true);
    setGlobalError(null);
    try {
      await AuthActions.CheckVerificationCodeAction({
        identifier: identifier,
        verification_code: watch("verification_code"),
      });
      setStep(2);
      setGlobalError(null);
    } catch (error: any) {
      setGlobalError(error.message || "Invalid or expired verification code.");
    } finally {
      setCheckingCode(false);
    }
  };

  const onSubmit = async (data: IResetPasswordForm) => {
    setGlobalError(null);
    try {
      await AuthActions.ResetPasswordAction({
        identifier: data.identifier || identifier,
        verification_code: data.verification_code,
        new_password: data.new_password,
      });
      router.push("/login?reset=true");
    } catch (error: any) {
      setGlobalError(error.message || "Failed to reset password. Please try again.");
    }
  };

  return (
    <fieldset disabled={isSubmitting} className="flex flex-col gap-6 w-full max-w-[380px] mx-auto">
      <BlurFade delay={0.1} yOffset={4}>
        <div className="flex flex-col space-y-1.5 text-center md:text-left mb-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {step === 1 ? "Enter Verification Code" : "Choose New Password"}
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            {step === 1 
              ? "Please enter the 6-digit confirmation code sent to your registered email address." 
              : "Set a strong and secure password for your CrypAlgos account."
            }
          </p>
        </div>
      </BlurFade>

      {globalError && (
        <BlurFade delay={0.2} yOffset={4}>
          <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive rounded-lg shadow-sm">
            <AlertCircle className="size-4" />
            <AlertDescription className="ml-2 font-medium text-xs leading-normal">{globalError}</AlertDescription>
          </Alert>
        </BlurFade>
      )}

      {/* Segmented Progress Stepper */}
      <BlurFade delay={0.3} yOffset={4}>
        <div className="flex flex-col gap-2 bg-secondary/10 p-3 rounded-xl border border-border/30">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-bold px-0.5">
            <span className="text-foreground tracking-wide">STEP {step} OF 2</span>
            <span className="uppercase tracking-widest opacity-70">
              {step === 1 && "Verification"}
              {step === 2 && "New Password"}
            </span>
          </div>
          <div className="h-1 w-full bg-secondary rounded-full overflow-hidden mt-1">
            <div 
              className="h-full bg-foreground rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>
      </BlurFade>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <AnimatePresence mode="wait">
          {/* Step 1 Form View */}
          {step === 1 && (
            <motion.div key="step-1" initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -10, opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-5">
              <Field data-invalid={!!errors.verification_code}>
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
                        disabled={isSubmitting || checkingCode}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} className="size-10 text-base font-bold bg-background dark:bg-white/[0.03] border-zinc-200 dark:border-border/50" />
                          <InputOTPSlot index={1} className="size-10 text-base font-bold bg-background dark:bg-white/[0.03] border-zinc-200 dark:border-border/50" />
                          <InputOTPSlot index={2} className="size-10 text-base font-bold bg-background dark:bg-white/[0.03] border-zinc-200 dark:border-border/50" />
                        </InputOTPGroup>
                        <InputOTPSeparator className="mx-1 text-muted-foreground/60 scale-125" />
                        <InputOTPGroup>
                          <InputOTPSlot index={3} className="size-10 text-base font-bold bg-background dark:bg-white/[0.03] border-zinc-200 dark:border-border/50" />
                          <InputOTPSlot index={4} className="size-10 text-base font-bold bg-background dark:bg-white/[0.03] border-zinc-200 dark:border-border/50" />
                          <InputOTPSlot index={5} className="size-10 text-base font-bold bg-background dark:bg-white/[0.03] border-zinc-200 dark:border-border/50" />
                        </InputOTPGroup>
                      </InputOTP>
                    )}
                  />
                </div>
                <FieldError errors={[errors.verification_code]} />
              </Field>

              <Button
                type="button"
                onClick={handleNextStep}
                disabled={checkingCode}
                className="w-full h-10 font-medium bg-foreground text-background hover:bg-foreground/90 transition-all rounded-md shadow-sm mt-4 flex items-center justify-center gap-2 group"
              >
                {checkingCode ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking code...
                  </>
                ) : (
                  <>
                    Continue to password setup
                    <ArrowRight className="h-4 w-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* Step 2 Form View */}
          {step === 2 && (
            <motion.div key="step-2" initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -10, opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-5">
              {/* Password Field */}
              <Field data-invalid={!!errors.new_password}>
                <FieldLabel htmlFor="new_password" className="text-foreground/90 font-medium flex items-center gap-1.5">
                  <Lock className="size-3.5 text-muted-foreground" />
                  New Password
                </FieldLabel>
                <div className="relative">
                  <Input
                    id="new_password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="h-10 bg-background dark:bg-white/[0.03] border-zinc-200 dark:border-border/50 focus-visible:ring-1 focus-visible:ring-primary transition-all rounded-md shadow-sm pr-10"
                    {...register("new_password")}
                    aria-invalid={!!errors.new_password}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <FieldError errors={[errors.new_password]} />

                {/* Real-time interactive strength meter */}
                {passwordVal ? (
                  <div className="space-y-2 mt-2 p-3 rounded-lg border border-border/30 bg-secondary/10">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Strength:</span>
                      <Badge variant={strength.variant} className="font-semibold text-[10px] py-0 px-2 rounded-sm">
                        {strength.text}
                      </Badge>
                    </div>
                    <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full transition-all duration-500 ease-out", strength.color)} 
                        style={{ width: `${(strength.score / 4) * 100}%` }}
                      />
                    </div>
                  </div>
                ) : null}
              </Field>

              {/* Confirm Password Field */}
              <Field data-invalid={!!errors.confirm_password}>
                <FieldLabel htmlFor="confirm_password" className="text-foreground/90 font-medium flex items-center gap-1.5">
                  <KeyRound className="size-3.5 text-muted-foreground" />
                  Confirm New Password
                </FieldLabel>
                <div className="relative">
                  <Input
                    id="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="h-10 bg-background dark:bg-white/[0.03] border-zinc-200 dark:border-border/50 focus-visible:ring-1 focus-visible:ring-primary transition-all rounded-md shadow-sm pr-10"
                    {...register("confirm_password")}
                    aria-invalid={!!errors.confirm_password}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <FieldError errors={[errors.confirm_password]} />
              </Field>

              <div className="flex gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                  className="w-12 h-10 px-0 flex items-center justify-center border-border/60 hover:bg-secondary transition-all rounded-md"
                >
                  <ArrowLeft className="size-4" />
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-10 font-medium bg-foreground text-background hover:bg-foreground/90 transition-all rounded-md shadow-sm flex items-center justify-center gap-2 group"
                  disabled={isSubmitting || passwordVal !== confirmPasswordVal || strength.score < 1}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Reset Password
                      <ArrowRight className="h-4 w-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <BlurFade delay={0.4} yOffset={4}>
        <div className="text-center mt-2">
          <Link
            href="/login"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to login
          </Link>
        </div>
      </BlurFade>
    </fieldset>
  );
}

export default function ResetPasswordPageWithSuspense() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center p-6 space-y-4 max-w-[400px] w-full min-h-[300px]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground animate-pulse font-medium">Loading password reset portal...</p>
      </div>
    }>
      <ResetPasswordPage />
    </Suspense>
  );
}
