"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle } from "lucide-react";

import { UserRegistrationSchema, IUserRegistrationSchema } from "@/schema/user.schema";
import { AuthActions } from "@/api-actions/auth-actions";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function RegisterPage() {
  const router = useRouter();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IUserRegistrationSchema>({
    resolver: zodResolver(UserRegistrationSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: IUserRegistrationSchema) => {
    setGlobalError(null);
    try {
      await AuthActions.RegisterAction(data);
      // Optional: Redirection to a verify-email page or directly login
      router.push("/login?registered=true");
    } catch (error: any) {
      setGlobalError(
        error?.response?.data?.message || "Registration failed. Please try again."
      );
    }
  };

  return (
    <div className="flex flex-col gap-6 mt-8 md:mt-0">
      <div className="flex flex-col space-y-2 text-center md:text-left mb-2">
        <h1 className="text-3xl font-semibold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Apply for early access to the infrastructure
        </p>
      </div>

      {globalError && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2 font-medium">{globalError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-foreground/80">Full Name</Label>
          <Input
            id="name"
            placeholder="John Doe"
            className="h-11 bg-black/5 dark:bg-white/5 border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all"
            {...register("name")}
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="text-xs text-destructive font-medium mt-1">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="username" className="text-foreground/80">Username</Label>
          <Input
            id="username"
            placeholder="johndoe"
            className="h-11 bg-black/5 dark:bg-white/5 border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all"
            {...register("username")}
            disabled={isSubmitting}
          />
          {errors.username && (
            <p className="text-xs text-destructive font-medium mt-1">{errors.username.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground/80">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            className="h-11 bg-black/5 dark:bg-white/5 border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all"
            {...register("email")}
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="text-xs text-destructive font-medium mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-foreground/80">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            className="h-11 bg-black/5 dark:bg-white/5 border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all"
            {...register("password")}
            disabled={isSubmitting}
          />
          {errors.password && (
            <p className="text-xs text-destructive font-medium mt-1">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-11 font-medium bg-foreground text-background hover:bg-foreground/90 transition-all rounded-lg mt-4"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Continue"
          )}
        </Button>
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
