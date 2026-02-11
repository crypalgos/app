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
    <div className="mx-auto grid w-[350px] gap-6">
      <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-bold">Reset Password</h1>
        <p className="text-balance text-muted-foreground">
          Enter your new password below
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormField
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email or Username</FormLabel>
                <FormControl>
                  <Input
                    placeholder="m@example.com"
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
                <FormLabel>Verification Code</FormLabel>
                <FormControl>
                  <InputOTP maxLength={6} {...field}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
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
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
