"use client";

import { useState } from "react";
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
  ShieldCheck,
  Mail
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { AuthActions } from "@/api-actions/auth-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup, Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { Badge } from "@/components/ui/badge";

// Premium form schema with password match validation on the frontend
const ForgotPasswordFormSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  verification_code: z.string().length(6, "Verification code must be exactly 6 digits"),
  new_password: z.string().min(8, "Password must be at least 8 characters long"),
  confirm_password: z.string().min(8, "Confirm password must be at least 8 characters long"),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

type IForgotPasswordForm = z.infer<typeof ForgotPasswordFormSchema>;

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

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [step, setStep] = useState<number>(1);
  
  const [requestingCode, setRequestingCode] = useState(false);
  const [checkingCode, setCheckingCode] = useState(false);
  
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<IForgotPasswordForm>({
    resolver: zodResolver(ForgotPasswordFormSchema),
    defaultValues: {
      identifier: "",
      verification_code: "",
      new_password: "",
      confirm_password: "",
    },
    mode: "onChange",
  });

  const identifierVal = watch("identifier");
  const otpVal = watch("verification_code");
  const passwordVal = watch("new_password") || "";
  const confirmPasswordVal = watch("confirm_password") || "";
  const strength = getPasswordStrength(passwordVal);

  // Step 1: Request reset code
  const handleRequestCode = async () => {
    const isIdentifierValid = await trigger("identifier");
    if (!isIdentifierValid) return;

    setRequestingCode(true);
    setGlobalError(null);
    try {
      await AuthActions.ForgotPasswordAction({ identifier: identifierVal });
      toast.success("Verification code sent to your registered email address.");
      setStep(2);
    } catch (error: any) {
      setGlobalError(
        error?.response?.data?.message || "Failed to send reset code. Please try again."
      );
    } finally {
      setRequestingCode(false);
    }
  };

  // Step 2: Validate code on backend before advancing
  const handleVerifyCode = async () => {
    const isOtpValid = await trigger("verification_code");
    if (!isOtpValid) return;

    setCheckingCode(true);
    setGlobalError(null);
    try {
      await AuthActions.CheckVerificationCodeAction({
        identifier: identifierVal,
        verification_code: otpVal,
      });
      setStep(3);
    } catch (error: any) {
      setGlobalError(
        error?.response?.data?.message || "Invalid or expired verification code."
      );
    } finally {
      setCheckingCode(false);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
      setGlobalError(null);
    }
  };

  // Step 3: Complete Password Reset
  const onSubmit = async (data: IForgotPasswordForm) => {
    setGlobalError(null);
    try {
      await AuthActions.ResetPasswordAction({
        identifier: data.identifier,
        verification_code: data.verification_code,
        new_password: data.new_password,
      });
      toast.success("Password reset successfully! Please sign in with your new credentials.");
      router.push("/login?reset=true");
    } catch (error: any) {
      setGlobalError(
        error?.response?.data?.message || "Failed to reset password. Please try again."
      );
    }
  };

  // Password strength checklist flags
  const hasMinLength = passwordVal?.length >= 8;
  const hasNumber = /\d/.test(passwordVal || "");
  const hasSpecial = /[^A-Za-z0-9]/.test(passwordVal || "");
  const isMatch = passwordVal && passwordVal === confirmPasswordVal;

  return (
    <div className="flex flex-col gap-6 mt-8 md:mt-0 max-w-md mx-auto w-full">
      <div className="flex flex-col space-y-2 text-center md:text-left mb-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {step === 1 && "Forgot password?"}
          {step === 2 && "Verification Code"}
          {step === 3 && "Choose New Password"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {step === 1 && "Enter your email or username to receive a reset code."}
          {step === 2 && "Please enter the 6-digit confirmation code sent to your email."}
          {step === 3 && "Set a strong and secure password for your CrypAlgos account."}
        </p>
      </div>

      {globalError && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive rounded-xl animate-in fade-in duration-300">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2 font-medium text-xs leading-normal">{globalError}</AlertDescription>
        </Alert>
      )}

      {/* Segmented Progress Stepper */}
      <div className="flex flex-col gap-2 bg-secondary/20 p-4 rounded-2xl border border-border/50">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-bold px-0.5">
          <span className="text-primary tracking-wide">STEP {step} OF 3</span>
          <span className="uppercase tracking-widest text-[10px]">
            {step === 1 && "Request code"}
            {step === 2 && "Verify identity"}
            {step === 3 && "Reset password"}
          </span>
        </div>
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mt-1.5">
          <div 
            className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
        
        {/* Step Bubble Dots */}
        <div className="flex justify-between items-center mt-3.5 px-1">
          {/* Step 1 */}
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold transition-all duration-300 border ${
              step > 1 
                ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" 
                : step === 1 
                ? "bg-primary border-primary text-primary-foreground shadow-sm" 
                : "bg-muted border-border text-muted-foreground"
            }`}>
              {step > 1 ? "✓" : "1"}
            </div>
            <span className={`text-[11px] font-bold transition-colors duration-300 ${
              step === 1 ? "text-foreground" : "text-muted-foreground/60"
            }`}>Request</span>
          </div>

          <div className="flex-1 h-[1px] bg-border/60 mx-2" />

          {/* Step 2 */}
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold transition-all duration-300 border ${
              step > 2 
                ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" 
                : step === 2 
                ? "bg-primary border-primary text-primary-foreground shadow-sm" 
                : "bg-muted border-border text-muted-foreground"
            }`}>
              {step > 2 ? "✓" : "2"}
            </div>
            <span className={`text-[11px] font-bold transition-colors duration-300 ${
              step === 2 ? "text-foreground" : "text-muted-foreground/60"
            }`}>Verify</span>
          </div>

          <div className="flex-1 h-[1px] bg-border/60 mx-2" />

          {/* Step 3 */}
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold transition-all duration-300 border ${
              step === 3 
                ? "bg-primary border-primary text-primary-foreground shadow-sm" 
                : "bg-muted border-border text-muted-foreground"
            }`}>
              3
            </div>
            <span className={`text-[11px] font-bold transition-colors duration-300 ${
              step === 3 ? "text-foreground" : "text-muted-foreground/60"
            }`}>Reset</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* STEP 1: Request Reset Code */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <Field data-invalid={!!errors.identifier}>
              <FieldLabel htmlFor="identifier" className="text-foreground/80">Email or Username</FieldLabel>
              <Input
                id="identifier"
                placeholder="name@example.com or username"
                className="h-11 bg-background dark:bg-white/5 border-zinc-200 dark:border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all"
                {...register("identifier")}
                aria-invalid={!!errors.identifier}
                disabled={requestingCode}
              />
              <FieldError errors={[errors.identifier]} />
            </Field>

            <Button
              type="button"
              onClick={handleRequestCode}
              disabled={requestingCode}
              className="w-full h-11 font-medium bg-foreground text-background hover:bg-foreground/90 transition-all rounded-lg mt-4 flex items-center justify-center gap-2 group"
            >
              {requestingCode ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending code...
                </>
              ) : (
                <>
                  Send reset code
                  <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* STEP 2: Verify Code */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
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
                      disabled={checkingCode}
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
              <FieldError errors={[errors.verification_code]} />
            </Field>

            <div className="flex gap-3 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={checkingCode}
                className="w-1/3 h-11 font-medium border-border/60 hover:bg-secondary transition-all rounded-lg flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <Button
                type="button"
                onClick={handleVerifyCode}
                disabled={checkingCode || otpVal?.length !== 6}
                className="flex-1 h-11 font-medium bg-foreground text-background hover:bg-foreground/90 transition-all rounded-lg flex items-center justify-center gap-2 group"
              >
                {checkingCode ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify Code
                    <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Setup Password */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
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
                  className="pr-10 h-11 bg-background dark:bg-white/5 border-zinc-200 dark:border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-xl"
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
              <FieldError errors={[errors.new_password]} />

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
                  className="pr-10 h-11 bg-background dark:bg-white/5 border-zinc-200 dark:border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-xl"
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
              <FieldError errors={[errors.confirm_password]} />
            </Field>

            <div className="flex gap-3 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={isSubmitting}
                className="w-1/3 h-11 font-medium border-border/60 hover:bg-secondary transition-all rounded-lg flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !hasMinLength || !isMatch}
                className="flex-1 h-11 font-medium bg-foreground text-background hover:bg-foreground/90 transition-all rounded-lg flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </div>
          </div>
        )}
      </form>

      <div className="text-center mt-2">
        <Link
          href="/login"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to login
        </Link>
      </div>
    </div>
  );
}
