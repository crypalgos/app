"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { VerifyUserSchema, IVerifyUserSchema } from "@/schema/user.schema";
import { AuthActions } from "@/api-actions/auth-actions";
import { useAuthStore } from "@/store/auth-store";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { AnimatedOTPInput } from "@/components/ui/animated-otp-input";
import { IconMailForward } from "@tabler/icons-react";

export function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setLogin = useAuthStore((state) => state.setLogin);
  const [isLoading, setIsLoading] = useState(false);

  const identifier = searchParams.get("identifier");

  const form = useForm<IVerifyUserSchema>({
    resolver: zodResolver(VerifyUserSchema),
    defaultValues: {
      identifier: identifier || "",
      verification_code: "",
    },
  });

  useEffect(() => {
    if (identifier) {
      form.setValue("identifier", identifier);
    }
  }, [identifier, form]);

  const onSubmit = async (data: IVerifyUserSchema) => {
    try {
      setIsLoading(true);
      const response = await AuthActions.VerifyUserAction(data);
      setLogin(response as any);
      toast.success(response.message || "Verification successful");
      router.push("/");
    } catch (error: any) {
      toast.error(error.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const onResend = async () => {
    const email = form.getValues("identifier");
    if (!email) {
      toast.error("Please enter your email to resend code");
      return;
    }
    try {
      setIsLoading(true);
      await AuthActions.ResendVerificationAction({ identifier: email });
      toast.success("Verification code resent");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl px-6">
      <div className="rounded-2xl border border-border/50 bg-card p-8 sm:p-10 shadow-xl shadow-black/5 dark:shadow-black/20 backdrop-blur-sm">
        <div className="grid gap-3 text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
            <IconMailForward className="h-7 w-7 text-violet-600 dark:text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Verify Your Account
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code sent to your email
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
            <FormField
              control={form.control}
              name="identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Email or Username
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="m@example.com"
                      className="h-11 rounded-xl bg-muted/50 border-border/50 focus:bg-background transition-colors"
                      {...field}
                      disabled={isLoading || !!identifier}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="verification_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Verification Code
                  </FormLabel>
                  <FormControl>
                    <AnimatedOTPInput maxLength={6} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-violet-500/25 transition-all duration-200 hover:shadow-violet-500/40 hover:-translate-y-0.5"
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Verify Account"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full h-11 rounded-xl text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:text-violet-400 dark:hover:text-violet-300 dark:hover:bg-violet-950/30 font-medium transition-colors"
              onClick={onResend}
              disabled={isLoading}
            >
              Didn&apos;t receive a code? Resend
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
