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

import { cn } from "@/lib/utils";
import { AuthActions } from "@/api-actions/auth-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup, Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { Badge } from "@/components/ui/badge";

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

  // Secure stepwise validation to verify code on backend before advancing
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
      setGlobalError(
        error?.response?.data?.message || "Invalid or expired verification code."
      );
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
      // Redirect to login after successful password reset
      router.push("/login?reset=true");
    } catch (error: any) {
      setGlobalError(
        error?.response?.data?.message || "Failed to reset password. Please try again."
      );
    }
  };

  return (
    <div className="flex flex-col gap-6 mt-4 md:mt-0 max-w-[400px] w-full">
      {/* Segmented Progress Stepper */}
      <div className="flex flex-col gap-2.5 w-full select-none mb-6">
        {/* Step labels */}
        <div className="flex justify-between items-center text-[10px] font-bold tracking-widest uppercase px-0.5">
          <span className={cn(
            "transition-colors duration-300", 
            step === 1 ? "text-foreground font-extrabold" : "text-muted-foreground/50"
          )}>
            01 / Verification
          </span>
          <span className={cn(
            "transition-colors duration-300", 
            step === 2 ? "text-foreground font-extrabold" : "text-muted-foreground/50"
          )}>
            02 / New Password
          </span>
        </div>
        {/* Progress bars */}
        <div className="flex gap-2 w-full h-[3px]">
          <div className={cn(
            "h-full rounded-full flex-1 transition-all duration-500", 
            step >= 1 ? "bg-primary" : "bg-muted/50"
          )} />
          <div className={cn(
            "h-full rounded-full flex-1 transition-all duration-500", 
            step >= 2 ? "bg-primary" : "bg-muted/50"
          )} />
        </div>
      </div>

      <div className="flex flex-col space-y-1.5 text-center md:text-left mb-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {step === 1 ? "Enter Verification Code" : "Choose New Password"}
        </h1>
        <p className="text-xs text-muted-foreground leading-normal">
          {step === 1 
            ? "Please enter the 6-digit confirmation code sent to your registered email address." 
            : "Set a strong and secure password for your CrypAlgos account."
          }
        </p>
      </div>

      {globalError ? (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive rounded-xl animate-in fade-in duration-300">
          <AlertCircle className="size-4" />
          <AlertDescription className="ml-2 font-medium text-xs leading-normal">{globalError}</AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Step 1 Form View */}
        {step === 1 ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <Field data-invalid={!!errors.verification_code}>
              <FieldLabel htmlFor="verification_code" className="text-xs font-semibold text-foreground/80 flex items-center justify-center sm:justify-start gap-1.5">
                <ShieldCheck className="size-3.5 text-muted-foreground" />
                6-Digit Verification Code
              </FieldLabel>
              <div className="flex justify-center mt-3 w-full">
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
                        <InputOTPSlot index={0} className="size-11 text-base md:text-lg font-bold bg-black/[0.02] dark:bg-white/[0.02] border-border/80" />
                        <InputOTPSlot index={1} className="size-11 text-base md:text-lg font-bold bg-black/[0.02] dark:bg-white/[0.02] border-border/80" />
                        <InputOTPSlot index={2} className="size-11 text-base md:text-lg font-bold bg-black/[0.02] dark:bg-white/[0.02] border-border/80" />
                      </InputOTPGroup>
                      <InputOTPSeparator className="mx-1 text-muted-foreground/60 scale-125" />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} className="size-11 text-base md:text-lg font-bold bg-black/[0.02] dark:bg-white/[0.02] border-border/80" />
                        <InputOTPSlot index={4} className="size-11 text-base md:text-lg font-bold bg-black/[0.02] dark:bg-white/[0.02] border-border/80" />
                        <InputOTPSlot index={5} className="size-11 text-base md:text-lg font-bold bg-black/[0.02] dark:bg-white/[0.02] border-border/80" />
                      </InputOTPGroup>
                    </InputOTP>
                  )}
                />
              </div>
              {errors.verification_code ? (
                <FieldDescription className="text-xs text-destructive text-center sm:text-left font-medium mt-2">
                  {errors.verification_code.message}
                </FieldDescription>
              ) : null}
            </Field>

            <Button
              type="button"
              onClick={handleNextStep}
              disabled={checkingCode}
              className="w-full h-11 font-medium bg-foreground text-background hover:bg-foreground/90 transition-all rounded-xl mt-4 flex items-center justify-center gap-2 group"
            >
              {checkingCode ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Checking code...
                </>
              ) : (
                <>
                  Continue to password setup
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </div>
        ) : null}

        {/* Step 2 Form View */}
        {step === 2 ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
            {/* Password Field */}
            <Field data-invalid={!!errors.new_password}>
              <FieldLabel htmlFor="new_password" className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                <Lock className="size-3.5 text-muted-foreground" />
                New Password
              </FieldLabel>
              <div className="relative mt-1.5">
                <Input
                  id="new_password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pr-10 h-11 bg-black/5 dark:bg-white/5 border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-xl"
                  {...register("new_password")}
                  aria-invalid={!!errors.new_password}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              {/* Real-time interactive strength meter */}
              {passwordVal ? (
                <div className="space-y-2 mt-2.5 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-border/20">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Strength:</span>
                    <Badge variant={strength.variant} className="font-semibold text-[10px] py-0.5 px-2">
                      {strength.text}
                    </Badge>
                  </div>
                  <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-500 ease-out", strength.color)} 
                      style={{ width: `${(strength.score / 4) * 100}%` }}
                    />
                  </div>
                  
                  {/* Visual checklist */}
                  <div className="grid grid-cols-2 gap-1.5 mt-2">
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <Check className={cn("size-3", passwordVal.length >= 8 ? "text-primary" : "text-muted-foreground")} />
                      <span className={cn(passwordVal.length >= 8 ? "text-foreground font-medium" : "text-muted-foreground")}>8+ characters</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <Check className={cn("size-3", /[A-Z]/.test(passwordVal) && /[a-z]/.test(passwordVal) ? "text-primary" : "text-muted-foreground")} />
                      <span className={cn(/[A-Z]/.test(passwordVal) && /[a-z]/.test(passwordVal) ? "text-foreground font-medium" : "text-muted-foreground")}>Case mixed</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <Check className={cn("size-3", /[0-9]/.test(passwordVal) ? "text-primary" : "text-muted-foreground")} />
                      <span className={cn(/[0-9]/.test(passwordVal) ? "text-foreground font-medium" : "text-muted-foreground")}>At least 1 number</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <Check className={cn("size-3", /[^A-Za-z0-9]/.test(passwordVal) ? "text-primary" : "text-muted-foreground")} />
                      <span className={cn(/[^A-Za-z0-9]/.test(passwordVal) ? "text-foreground font-medium" : "text-muted-foreground")}>Special character</span>
                    </div>
                  </div>
                </div>
              ) : null}

              {errors.new_password ? (
                <FieldDescription className="text-xs text-destructive font-medium mt-1.5">
                  {errors.new_password.message}
                </FieldDescription>
              ) : null}
            </Field>

            {/* Confirm Password Field */}
            <Field data-invalid={!!errors.confirm_password}>
              <FieldLabel htmlFor="confirm_password" className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                <KeyRound className="size-3.5 text-muted-foreground" />
                Confirm New Password
              </FieldLabel>
              <div className="relative mt-1.5">
                <Input
                  id="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pr-10 h-11 bg-black/5 dark:bg-white/5 border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-xl"
                  {...register("confirm_password")}
                  aria-invalid={!!errors.confirm_password}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              {/* Match Feedback Badge */}
              {confirmPasswordVal ? (
                <div className="flex items-center gap-1.5 mt-2 animate-in fade-in duration-200">
                  {passwordVal === confirmPasswordVal ? (
                    <Badge variant="secondary" className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 border-none px-2 py-0.5 rounded-md text-[10px] font-semibold">
                      <Check className="size-3 stroke-[2.5px]" />
                      Passwords match
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="flex items-center gap-1 bg-destructive/10 text-destructive border-none px-2 py-0.5 rounded-md text-[10px] font-semibold">
                      <AlertCircle className="size-3" />
                      Passwords do not match
                    </Badge>
                  )}
                </div>
              ) : null}

              {errors.confirm_password ? (
                <FieldDescription className="text-xs text-destructive font-medium mt-1.5">
                  {errors.confirm_password.message}
                </FieldDescription>
              ) : null}
            </Field>

            <div className="flex gap-3 mt-4">
              <Button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 h-11 border border-border bg-transparent text-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-xl font-medium transition-all"
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 font-medium bg-foreground text-background hover:bg-foreground/90 transition-all rounded-xl flex items-center justify-center gap-2"
                disabled={isSubmitting || passwordVal !== confirmPasswordVal || strength.score < 1}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </form>

      <div className="text-center mt-2">
        <Link
          href="/login"
          className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="mr-2 size-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back to login
        </Link>
      </div>
    </div>
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
