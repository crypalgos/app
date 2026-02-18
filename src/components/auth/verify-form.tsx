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

  // Update identifier if changed in URL
  useEffect(() => {
    if (identifier) {
      form.setValue("identifier", identifier);
    }
  }, [identifier, form]);

  const onSubmit = async (data: IVerifyUserSchema) => {
    try {
      setIsLoading(true);
      const response = await AuthActions.VerifyUserAction(data);
      // Assuming VerifyUserAction returns a login response structure or we need to handle it
      // The schema says returns IVerifyUserResponse which has user and tokens

      // We need to match the structure expected by setLogin (ILoginResponse)
      // IVerifyUserResponse has user, access_token (Record<string, string>), message
      // ILoginResponse has user, access_token (Record<string, string>), message
      // They seem compatible
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
    <div className="mx-auto grid w-[350px] gap-6">
      <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-bold">Verify Account</h1>
        <p className="text-balance text-muted-foreground">
          Enter the verification code sent to your email
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
                  <AnimatedOTPInput maxLength={6} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={onResend}
            disabled={isLoading}
          >
            Resend Code
          </Button>
        </form>
      </Form>
    </div>
  );
}
