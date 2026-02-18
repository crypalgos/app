"use client";

import { useForm } from "react-hook-form";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { VerifyUserSchema, IVerifyUserSchema } from "@/schema/user.schema";
import { AuthActions } from "@/api-actions/auth-actions";
import { useAuthStore } from "@/store/auth-store";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
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
      const detailMsg = error.errors?.detail;
      toast.error(detailMsg || error.message || "Verification failed");
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
      const detailMsg = error.errors?.detail;
      toast.error(detailMsg || error.message || "Failed to resend code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-2 transition-transform hover:scale-110 duration-500">
          <IconMailForward className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2 text-left">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
            Verify <span className="text-primary">Account</span>
          </h1>
          <p className="text-base text-muted-foreground font-medium opacity-70">
            Enter the 6-digit code sent to your email to activate your terminal
          </p>
          <div className="pt-8 space-y-6">
            <div className="flex items-center justify-center gap-4 opacity-20">
              <div className="h-px grow bg-border" />
              <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                Terminal Recovery
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
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Internal field for form state, hidden from UI as per user request */}
          <input type="hidden" {...form.register("identifier")} />

          <FormField
            control={form.control}
            name="verification_code"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">
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
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 mt-4 overflow-hidden group relative"
            disabled={isLoading}
          >
            <div className="absolute inset-0 bg-linear-to-r from-primary via-white/10 to-primary origin-left -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
            {isLoading ? (
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-3 border-primary-foreground border-t-transparent" />
                Verifying...
              </div>
            ) : (
              "Verify terminal access"
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full h-12 rounded-xl text-primary font-bold transition-all hover:bg-primary/10 hover:text-primary uppercase tracking-widest text-xs"
            onClick={onResend}
            disabled={isLoading}
          >
            Didn&apos;t receive code? Resend
          </Button>
          <div className="pt-8 space-y-6">
            <div className="flex items-center justify-center gap-4 opacity-20">
              <div className="h-px grow bg-border" />
              <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                Secure Terminal Access
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
