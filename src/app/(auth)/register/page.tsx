"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, AlertCircle, CheckCircle2, XCircle, ArrowLeft, ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";

import { AuthActions } from "@/api-actions/auth-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup, Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { GoogleLoginButton } from "@/components/google-login-button";

// Client-side schema that includes Password and Confirm Password validation
const ClientRegistrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain alphanumeric characters and underscores"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm Password must be at least 8 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type IClientRegistrationSchema = z.infer<typeof ClientRegistrationSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [step, setStep] = useState<number>(1);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<IClientRegistrationSchema>({
    resolver: zodResolver(ClientRegistrationSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const usernameValue = watch("username");
  const passwordValue = watch("password");
  const confirmPasswordValue = watch("confirmPassword");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  // Debounced real-time username availability validation
  useEffect(() => {
    const checkUsername = async () => {
      if (!usernameValue || usernameValue.length < 3 || !/^[a-zA-Z0-9_]+$/.test(usernameValue)) {
        setUsernameAvailable(null);
        return;
      }
      
      setIsCheckingUsername(true);
      try {
        const result = await AuthActions.CheckUsernameAvailabilityAction({ username: usernameValue });
        if (result.available) {
          setUsernameAvailable(true);
          clearErrors("username");
        } else {
          setUsernameAvailable(false);
          setError("username", { type: "manual", message: "Username is already taken." });
        }
      } catch (err: any) {
        setUsernameAvailable(false);
        setError("username", { type: "manual", message: "Username is not available." });
      } finally {
        setIsCheckingUsername(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      checkUsername();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [usernameValue, setError, clearErrors]);

  const handleNextStep = async () => {
    if (step === 1) {
      // Validate fields for Step 1
      const isValid = await trigger(["name", "email"]);
      if (isValid) {
        setStep(2);
      }
    } else if (step === 2) {
      // Validate fields for Step 2
      const isValid = await trigger(["username"]);
      if (isValid && usernameAvailable === true) {
        setStep(3);
      } else if (usernameAvailable === false) {
        setError("username", { type: "manual", message: "Please choose an available username." });
      }
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const onSubmit = async (data: IClientRegistrationSchema) => {
    if (usernameAvailable === false) return;
    setGlobalError(null);
    try {
      // Exclude confirmPassword from database submit
      const { confirmPassword, ...registrationData } = data;
      await AuthActions.RegisterAction(registrationData);
      router.push(`/verify?identifier=${encodeURIComponent(data.email)}`);
    } catch (error: any) {
      setGlobalError(
        error?.response?.data?.message || "Registration failed. Please try again."
      );
    }
  };

  // Live password indicator calculations
  const hasMinLength = passwordValue?.length >= 8;
  const hasNumber = /\d/.test(passwordValue || "");
  const hasSpecial = /[^A-Za-z0-9]/.test(passwordValue || "");
  const isMatch = passwordValue && passwordValue === confirmPasswordValue;

  return (
    <div className="flex flex-col gap-6 mt-8 md:mt-0 max-w-md mx-auto w-full">
      <div className="flex flex-col space-y-2 text-center md:text-left mb-2">
        <h1 className="text-3xl font-semibold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Apply for early access to the infrastructure
        </p>
      </div>

      {globalError && (
        globalError.toLowerCase().includes("waitlist") ? (
          <Alert className="bg-primary/10 border-primary/20 text-primary rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-start gap-2.5">
              <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-foreground">Pre-Launch Phase Only</h4>
                <AlertDescription className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {globalError} Join our waitlist to be among the first to get access when invitations open.
                </AlertDescription>
              </div>
            </div>
            <Button asChild size="sm" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-1 font-semibold rounded-lg">
              <Link href="/waitlist">Join the Waitlist</Link>
            </Button>
          </Alert>
        ) : (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive rounded-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2 font-medium">{globalError}</AlertDescription>
          </Alert>
        )
      )}

      {/* Social Provider Option - Only shown on Step 1 for best conversion */}
      {step === 1 && (
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
      )}

      {/* Premium Multi-step Progress Tracker */}
      <div className="flex flex-col gap-2 mb-2 bg-secondary/20 p-4 rounded-2xl border border-border/50">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-bold px-0.5">
          <span className="text-primary tracking-wide">STEP {step} OF 3</span>
          <span className="uppercase tracking-widest text-[10px]">
            {step === 1 && "Personal details"}
            {step === 2 && "Profile setup"}
            {step === 3 && "Security settings"}
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
            }`}>Details</span>
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
            }`}>Username</span>
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
            }`}>Security</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* STEP 1: Personal Details */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name" className="text-foreground/80">Full Name</FieldLabel>
              <Input
                id="name"
                placeholder="John Doe"
                className="h-11 bg-background dark:bg-white/5 border-zinc-200 dark:border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              <FieldError errors={[errors.name]} />
            </Field>

            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email" className="text-foreground/80">Email address</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="h-11 bg-background dark:bg-white/5 border-zinc-200 dark:border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all"
                {...register("email")}
                aria-invalid={!!errors.email}
              />
              <FieldError errors={[errors.email]} />
            </Field>

            <Button
              type="button"
              onClick={handleNextStep}
              className="w-full h-11 font-medium bg-foreground text-background hover:bg-foreground/90 transition-all rounded-lg mt-4 flex items-center justify-center gap-2 group"
            >
              Continue Setup
              <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </div>
        )}

        {/* STEP 2: Choose Username */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <Field data-invalid={!!errors.username}>
              <FieldLabel htmlFor="username" className="text-foreground/80">Username</FieldLabel>
              <div className="relative">
                <Input
                  id="username"
                  placeholder="johndoe"
                  className="h-11 bg-background dark:bg-white/5 border-zinc-200 dark:border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all pr-10"
                  {...register("username")}
                  aria-invalid={!!errors.username}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  {isCheckingUsername && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  {!isCheckingUsername && usernameAvailable === true && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  {!isCheckingUsername && usernameAvailable === false && <XCircle className="h-4 w-4 text-destructive" />}
                </div>
              </div>
              <FieldError errors={[errors.username]} />
              {!errors.username && usernameAvailable === true && (
                <FieldDescription className="text-emerald-500 flex items-center gap-1.5 mt-1 font-medium text-xs">
                  <CheckCircle2 className="size-3.5" />
                  Username is available
                </FieldDescription>
              )}
            </Field>

            <div className="flex gap-3 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="w-1/3 h-11 font-medium border-border/60 hover:bg-secondary transition-all rounded-lg flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={isCheckingUsername || usernameAvailable !== true}
                className="flex-1 h-11 font-medium bg-foreground text-background hover:bg-foreground/90 transition-all rounded-lg flex items-center justify-center gap-2 group"
              >
                Secure Account
                <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Security Settings (Password & Confirmation) */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password" className="text-foreground/80">Password</FieldLabel>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-11 bg-background dark:bg-white/5 border-zinc-200 dark:border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all pr-10"
                  {...register("password")}
                  aria-invalid={!!errors.password}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <FieldError errors={[errors.password]} />
            </Field>

            <Field data-invalid={!!errors.confirmPassword}>
              <FieldLabel htmlFor="confirmPassword" className="text-foreground/80">Confirm Password</FieldLabel>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-11 bg-background dark:bg-white/5 border-zinc-200 dark:border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all pr-10"
                  {...register("confirmPassword")}
                  aria-invalid={!!errors.confirmPassword}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <FieldError errors={[errors.confirmPassword]} />
            </Field>

            {/* Micro UX Feedback: Real-time indicators of password status */}
            <div className="bg-secondary/15 rounded-xl p-3 border border-border/40 space-y-2 text-xs">
              <p className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Security Strength</p>
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`size-3.5 transition-colors ${hasMinLength ? "text-emerald-500" : "text-muted-foreground/40"}`} />
                <span className={hasMinLength ? "text-foreground font-medium" : "text-muted-foreground/60"}>At least 8 characters</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`size-3.5 transition-colors ${hasNumber || hasSpecial ? "text-emerald-500" : "text-muted-foreground/40"}`} />
                <span className={hasNumber || hasSpecial ? "text-foreground font-medium" : "text-muted-foreground/60"}>Contains numbers or symbols</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`size-3.5 transition-colors ${isMatch ? "text-emerald-500" : "text-muted-foreground/40"}`} />
                <span className={isMatch ? "text-foreground font-medium" : "text-muted-foreground/60"}>Passwords match perfectly</span>
              </div>
            </div>

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
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </div>
          </div>
        )}
      </form>

      <div className="text-center mt-2">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground hover:text-primary transition-colors hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-4 px-4">
        By clicking continue, you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
