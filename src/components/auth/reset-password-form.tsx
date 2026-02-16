"use client";
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
    <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-2 transition-transform hover:scale-110 duration-500">
          <IconShieldLock className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2 text-left">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
            Reset <span className="text-primary">Password</span>
          </h1>
          <p className="text-base text-muted-foreground font-medium opacity-70">
            Secure your terminal access with a new password
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">
                  Email Address
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="m@example.com"
                    className="h-12 rounded-xl bg-muted/20 border-border focus:ring-primary/20 transition-all text-base placeholder:text-muted-foreground/50"
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
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">
                  Verification Code
                </FormLabel>
                <FormControl>
                  <InputOTP maxLength={6} {...field}>
                    <InputOTPGroup className="w-full justify-between gap-2">
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <InputOTPSlot
                          key={index}
                          index={index}
                          className="h-12 w-full text-lg rounded-xl bg-muted/20 border-border focus:ring-primary/20 transition-all"
                        />
                      ))}
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
          <Button
            type="submit"
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 mt-4 overflow-hidden group relative"
            disabled={isLoading}
          >
            <div className="absolute inset-0 bg-linear-to-r from-primary via-white/10 to-primary origin-left -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
            {isLoading ? (
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-3 border-primary-foreground border-t-transparent" />
                Resetting...
              </div>
            ) : (
              "Apply New Password"
            )}
          </Button>

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
