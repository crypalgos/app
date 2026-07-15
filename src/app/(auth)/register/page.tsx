"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, AlertCircle, CheckCircle2, XCircle, ArrowLeft, ArrowRight, Eye, EyeOff, Sparkles, User, Mail, AtSign, Lock, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { AuthActions } from "@/api-actions/auth-actions";
import { GoogleLoginButton } from "@/components/google-login-button";
import { BlurFade } from "@/components/ui/auth-animations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup, Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";

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
    defaultValues: { name: "", email: "", username: "", password: "", confirmPassword: "" },
  });

  const usernameValue = watch("username");
  const passwordValue = watch("password");
  const confirmPasswordValue = watch("confirmPassword");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

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
    const delayDebounceFn = setTimeout(checkUsername, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [usernameValue, setError, clearErrors]);

  const handleNextStep = async () => {
    if (step === 1) {
      if (await trigger(["name", "email"])) setStep(2);
    } else if (step === 2) {
      const isValid = await trigger(["username"]);
      if (isValid && usernameAvailable === true) setStep(3);
      else if (usernameAvailable === false) setError("username", { type: "manual", message: "Please choose an available username." });
    }
  };

  const handlePrevStep = () => { if (step > 1) setStep((prev) => prev - 1); };

  const onSubmit = async (data: IClientRegistrationSchema) => {
    if (usernameAvailable === false) return;
    setGlobalError(null);
    try {
      const { confirmPassword, ...registrationData } = data;
      await AuthActions.RegisterAction(registrationData);
      router.push(`/verify?identifier=${encodeURIComponent(data.email)}`);
    } catch (error: any) {
      setGlobalError(error.message || "Registration failed. Please try again.");
    }
  };

  const hasMinLength = passwordValue?.length >= 8;
  const hasNumber = /\d/.test(passwordValue || "");
  const hasSpecial = /[^A-Za-z0-9]/.test(passwordValue || "");
  const isMatch = passwordValue && passwordValue === confirmPasswordValue;

  return (
    <fieldset disabled={isSubmitting} className="flex flex-col gap-6 w-full max-w-[380px] mx-auto">
      <BlurFade delay={0.1} yOffset={4}>
        <div className="flex flex-col space-y-1.5 text-center md:text-left mb-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {step === 1 ? "Create account" : step === 2 ? "Pick a username" : "Secure it"}
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            {step === 1 ? "Apply for early access to the infrastructure" : step === 2 ? "This will be your unique identity" : "Protect your account with a strong password"}
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

      {step === 1 && (
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
      )}

      {/* Progress Tracker */}
      <BlurFade delay={0.4} yOffset={4}>
        <div className="flex flex-col gap-2 mb-2 bg-secondary/10 p-3 rounded-xl border border-border/30">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-bold px-0.5">
            <span className="text-foreground tracking-wide">STEP {step} OF 3</span>
            <span className="uppercase tracking-widest opacity-70">
              {step === 1 && "Personal details"}
              {step === 2 && "Profile setup"}
              {step === 3 && "Security settings"}
            </span>
          </div>
          <div className="h-1 w-full bg-secondary rounded-full overflow-hidden mt-1">
            <div 
              className="h-full bg-foreground rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>
      </BlurFade>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: PERSONAL DETAILS */}
          {step === 1 && (
            <motion.div key="step-1" initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -10, opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-5 w-full">
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="name" className="text-foreground/90 font-medium">Full Name</FieldLabel>
                <Input
                  id="name"
                  placeholder="John Doe"
                  className="h-10 bg-background dark:bg-white/[0.03] border-zinc-200 dark:border-border/50 focus-visible:ring-1 focus-visible:ring-primary transition-all rounded-md shadow-sm"
                  {...register("name")}
                  aria-invalid={!!errors.name}
                />
                <FieldError errors={[errors.name]} />
              </Field>

              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email" className="text-foreground/90 font-medium">Email Address</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="h-10 bg-background dark:bg-white/[0.03] border-zinc-200 dark:border-border/50 focus-visible:ring-1 focus-visible:ring-primary transition-all rounded-md shadow-sm"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                />
                <FieldError errors={[errors.email]} />
              </Field>

              <Button
                type="button"
                onClick={handleNextStep}
                className="w-full h-10 font-medium bg-foreground text-background hover:bg-foreground/90 transition-all rounded-md shadow-sm mt-2 flex items-center justify-center gap-2 group"
              >
                Continue Setup
                <ArrowRight className="h-4 w-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </motion.div>
          )}

          {/* STEP 2: USERNAME */}
          {step === 2 && (
            <motion.div key="step-2" initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -10, opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-5 w-full">
              <Field data-invalid={!!errors.username}>
                <FieldLabel htmlFor="username" className="text-foreground/90 font-medium">Username</FieldLabel>
                <div className="relative">
                  <Input
                    id="username"
                    placeholder="johndoe"
                    className="h-10 bg-background dark:bg-white/[0.03] border-zinc-200 dark:border-border/50 focus-visible:ring-1 focus-visible:ring-primary transition-all rounded-md shadow-sm pr-10"
                    {...register("username")}
                    aria-invalid={!!errors.username}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    {isCheckingUsername && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    {!isCheckingUsername && usernameAvailable === true && <CheckCircle2 className="h-4 w-4 text-foreground" />}
                    {!isCheckingUsername && usernameAvailable === false && <XCircle className="h-4 w-4 text-destructive" />}
                  </div>
                </div>
                <FieldError errors={[errors.username]} />
                {!errors.username && usernameAvailable === true && (
                  <FieldDescription className="text-foreground/80 flex items-center gap-1.5 mt-1 font-medium text-[11px]">
                    <CheckCircle2 className="size-3" />
                    Username is available
                  </FieldDescription>
                )}
              </Field>

              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  className="w-12 h-10 px-0 flex items-center justify-center"
                >
                  <ArrowLeft className="size-4" />
                </Button>
                <Button
                  type="button"
                  onClick={handleNextStep}
                  disabled={isCheckingUsername || usernameAvailable !== true}
                  className="flex-1 h-10 font-medium bg-foreground text-background hover:bg-foreground/90 transition-all rounded-md shadow-sm flex items-center justify-center gap-2 group"
                >
                  Secure Account
                  <ArrowRight className="h-4 w-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: SECURITY */}
          {step === 3 && (
            <motion.div key="step-3" initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -10, opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-5 w-full">
              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password" className="text-foreground/90 font-medium">Password</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="h-10 bg-background dark:bg-white/[0.03] border-zinc-200 dark:border-border/50 focus-visible:ring-1 focus-visible:ring-primary transition-all rounded-md shadow-sm pr-10"
                    {...register("password")}
                    aria-invalid={!!errors.password}
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
                <FieldLabel htmlFor="confirmPassword" className="text-foreground/90 font-medium">Confirm Password</FieldLabel>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="h-10 bg-background dark:bg-white/[0.03] border-zinc-200 dark:border-border/50 focus-visible:ring-1 focus-visible:ring-primary transition-all rounded-md shadow-sm pr-10"
                    {...register("confirmPassword")}
                    aria-invalid={!!errors.confirmPassword}
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
              
              <div className="bg-secondary/10 rounded-lg p-3 border border-border/30 space-y-1.5 text-xs">
                <p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Security Strength</p>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`size-3 transition-colors ${hasMinLength ? "text-foreground" : "text-muted-foreground/40"}`} />
                  <span className={hasMinLength ? "text-foreground font-medium" : "text-muted-foreground"}>At least 8 characters</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`size-3 transition-colors ${hasNumber || hasSpecial ? "text-foreground" : "text-muted-foreground/40"}`} />
                  <span className={hasNumber || hasSpecial ? "text-foreground font-medium" : "text-muted-foreground"}>Contains numbers or symbols</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`size-3 transition-colors ${isMatch ? "text-foreground" : "text-muted-foreground/40"}`} />
                  <span className={isMatch ? "text-foreground font-medium" : "text-muted-foreground"}>Passwords match perfectly</span>
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  className="w-12 h-10 px-0 flex items-center justify-center"
                >
                  <ArrowLeft className="size-4" />
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !hasMinLength || !isMatch}
                  className="flex-1 h-10 font-medium bg-foreground text-background hover:bg-foreground/90 transition-all rounded-md shadow-sm flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </form>

      {step === 1 && (
        <BlurFade delay={0.5} yOffset={4}>
          <div className="text-center mt-2">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-foreground hover:text-foreground/80 transition-colors hover:underline">Sign in</Link>
            </p>
          </div>
          <p className="text-center text-[11px] text-muted-foreground mt-4 px-2">
            By clicking continue, you agree to our <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">Terms of Service</Link> and <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">Privacy Policy</Link>.
          </p>
        </BlurFade>
      )}
    </fieldset>
  );
}
