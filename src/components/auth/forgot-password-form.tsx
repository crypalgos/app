"use client";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ForgotPasswordSchema,
  IForgotPasswordSchema,
} from "@/schema/user.schema";
import { AuthActions } from "@/api-actions/auth-actions";
import { useRouter } from "next/navigation";
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
import { useState } from "react";
import Link from "next/link";
import { IconLock, IconMailCheck, IconChevronLeft } from "@tabler/icons-react";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<IForgotPasswordSchema>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      identifier: "",
    },
  });

  const onSubmit = async (data: IForgotPasswordSchema) => {
    try {
      setIsLoading(true);
      const response = await AuthActions.ForgotPasswordAction(data);
      toast.success(response.message || "Reset code sent to your email");
      router.push(
        `/reset-password?identifier=${encodeURIComponent(data.identifier)}`,
      );
    } catch (error: any) {
      const detailMsg = error.errors?.detail;
      toast.error(detailMsg || error.message || "Failed to send reset link");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-6">

        <div className="space-y-2 text-left">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
            Forgot <span className="text-primary">Password?</span>
          </h1>
          <p className="text-base text-muted-foreground font-medium opacity-70">
            No worries — enter your email and we&apos;ll send you a reset link
          </p>
        </div>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
          <FormField
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">
                  Email or Username
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="m@example.com"
                    className="h-12 rounded-xl bg-muted/20 border-border focus:ring-primary/20 transition-all text-base placeholder:text-muted-foreground/50"
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
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 mt-2 overflow-hidden group relative"
            disabled={isLoading}
          >
            <div className="absolute inset-0 bg-linear-to-r from-primary via-white/10 to-primary origin-left -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
            {isLoading ? (
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-3 border-primary-foreground border-t-transparent" />
                Sending...
              </div>
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </form>
      </Form>
      <div className="pt-8 text-center">
        <Link
          href="/login"
          className="inline-flex items-center text-sm font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest"
        >
          <IconChevronLeft className="mr-2 h-4 w-4" />
          Back to login
        </Link>

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
  );
}
