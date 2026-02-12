"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ResetPasswordSchema,
  IResetPasswordSchema,
} from "@/schema/user.schema";
import { AuthActions } from "@/api-actions/auth-actions";
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { IconShieldLock } from "@tabler/icons-react";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const identifier = searchParams.get("identifier");
  const code = searchParams.get("code");

  const form = useForm<IResetPasswordSchema>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      identifier: identifier || "",
      verification_code: code || "",
      new_password: "",
    },
  });

  useEffect(() => {
    if (identifier) form.setValue("identifier", identifier);
    if (code) form.setValue("verification_code", code);
  }, [identifier, code, form]);

  const onSubmit = async (data: IResetPasswordSchema) => {
    try {
      setIsLoading(true);
      await AuthActions.ResetPasswordAction(data);
      toast.success("Password reset successfully. Please login.");
      router.push("/login");
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl px-6">
      <div className="rounded-2xl border border-border/50 bg-card p-8 sm:p-10 shadow-xl shadow-black/5 dark:shadow-black/20 backdrop-blur-sm">
        <div className="grid gap-3 text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
            <IconShieldLock className="h-7 w-7 text-violet-600 dark:text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Reset Password</h1>
          <p className="text-sm text-muted-foreground">
            Enter your verification code and new password
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
                    <InputOTP maxLength={6} {...field}>
                      <InputOTPGroup className="w-full justify-between">
                        <InputOTPSlot
                          index={0}
                          className="h-12 w-12 text-lg rounded-xl"
                        />
                        <InputOTPSlot
                          index={1}
                          className="h-12 w-12 text-lg rounded-xl"
                        />
                        <InputOTPSlot
                          index={2}
                          className="h-12 w-12 text-lg rounded-xl"
                        />
                        <InputOTPSlot
                          index={3}
                          className="h-12 w-12 text-lg rounded-xl"
                        />
                        <InputOTPSlot
                          index={4}
                          className="h-12 w-12 text-lg rounded-xl"
                        />
                        <InputOTPSlot
                          index={5}
                          className="h-12 w-12 text-lg rounded-xl"
                        />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="new_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    New Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      className="h-11 rounded-xl bg-muted/50 border-border/50 focus:bg-background transition-colors"
                      {...field}
                      disabled={isLoading}
                    />
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
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
