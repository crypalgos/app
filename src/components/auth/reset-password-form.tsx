"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import Image from "next/image";
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

interface IResetPasswordFormValues extends IResetPasswordSchema {
  confirm_password: string;
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const identifierParam = searchParams.get("identifier");
  const codeParam = searchParams.get("code");

  const form = useForm<IResetPasswordFormValues>({
    resolver: zodResolver(
      ResetPasswordSchema.extend({
        confirm_password: z.string().min(8, "Confirm password is required"),
      }).refine((data) => data.new_password === data.confirm_password, {
        message: "Passwords don't match",
        path: ["confirm_password"],
      }),
    ),
    defaultValues: {
      identifier: identifierParam || "",
      verification_code: codeParam || "",
      new_password: "",
      confirm_password: "",
    },
  });

  useEffect(() => {
    if (identifierParam) form.setValue("identifier", identifierParam);
    if (codeParam) form.setValue("verification_code", codeParam);
  }, [identifierParam, codeParam, form]);

  const handleNextStep = async () => {
    const isValid = await form.trigger(["identifier", "verification_code"]);
    if (!isValid) return;

    try {
      setIsLoading(true);
      await AuthActions.CheckVerificationCodeAction({
        identifier: form.getValues("identifier"),
        verification_code: form.getValues("verification_code"),
      });
      setStep(2);
      toast.success("Code verified. Please set your new password.");
    } catch (error: any) {
      const detailMsg = error.errors?.detail;
      toast.error(detailMsg || error.message || "Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: IResetPasswordFormValues) => {
    try {
      setIsLoading(true);
      const { confirm_password, ...resetData } = data;
      await AuthActions.ResetPasswordAction(resetData);
      toast.success("Password reset successfully. Please login.");
      router.push("/login");
    } catch (error: any) {
      const detailMsg = error.errors?.detail;
      toast.error(detailMsg || error.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-6">
        <div className="space-y-2 text-left">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            {step === 1 ? (
              <>
                Verify <span className="text-primary">Identity</span>
              </>
            ) : (
              <>
                New <span className="text-primary">Terminal Key</span>
              </>
            )}
          </h1>
          <p className="text-base text-muted-foreground font-medium opacity-70">
            {step === 1
              ? "Enter the code sent to your terminal access email"
              : "Secure your account with a strong new password"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Internal state persistence fields */}
          <input type="hidden" {...form.register("identifier")} />
          {step === 2 && (
            <input type="hidden" {...form.register("verification_code")} />
          )}

          {step === 1 ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <FormField
                control={form.control}
                name="verification_code"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">
                      Verification Code
                    </FormLabel>
                    <FormControl>
                      <InputOTP maxLength={6} {...field}>
                        <InputOTPGroup className="w-full justify-between gap-3 text-primary font-mono font-bold">
                          {[0, 1, 2, 3, 4, 5].map((index) => (
                            <InputOTPSlot
                              key={index}
                              index={index}
                              className="h-14 w-full text-xl rounded-xl bg-muted/20 border border-border transition-all ring-offset-background"
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Internal field for form state, hidden from UI */}
              <input type="hidden" {...form.register("identifier")} />

              <Button
                type="button"
                onClick={handleNextStep}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 mt-2 overflow-hidden group relative"
                disabled={isLoading}
              >
                <div className="absolute inset-0 bg-linear-to-r from-primary via-white/10 to-primary origin-left -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-3 border-primary-foreground border-t-transparent" />
                    Checking...
                  </div>
                ) : (
                  "Verify & Continue"
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
              <FormField
                control={form.control}
                name="new_password"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">
                      New Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="h-12 rounded-xl bg-muted/20 border-border focus:ring-primary/20 transition-all text-base"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">
                      Confirm Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="h-12 rounded-xl bg-muted/20 border-border focus:ring-primary/20 transition-all text-base"
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
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 mt-4 overflow-hidden group relative"
                disabled={isLoading}
              >
                <div className="absolute inset-0 bg-linear-to-r from-primary via-white/10 to-primary origin-left -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-3 border-primary-foreground border-t-transparent" />
                    Updating...
                  </div>
                ) : (
                  "Update & Secure"
                )}
              </Button>
            </div>
          )}

          <div className="pt-8 space-y-6">
            <div className="flex items-center justify-center gap-4 opacity-20">
              <div className="h-px grow bg-border" />
              <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                Terminal Security
              </span>
              <div className="h-px grow bg-border" />
            </div>
            <div className="flex justify-center gap-6 opacity-60 contrast-125 saturate-[0.8]">
              <Image
                src="/crypto-icons/bitcoin.png"
                alt="BTC"
                width={24}
                height={24}
                className="h-5 w-5"
              />
              <Image
                src="/crypto-icons/ethereum.png"
                alt="ETH"
                width={24}
                height={24}
                className="h-5 w-5"
              />
              <Image
                src="/crypto-icons/solana.png"
                alt="SOL"
                width={24}
                height={24}
                className="h-5 w-5"
              />
              <Image
                src="/crypto-icons/usdt.png"
                alt="USDT"
                width={24}
                height={24}
                className="h-5 w-5"
              />
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
