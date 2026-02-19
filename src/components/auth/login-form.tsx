"use client";

import { useForm } from "react-hook-form";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserLoginSchema, IUserLoginSchema } from "@/schema/user.schema";
import { AuthActions } from "@/api-actions/auth-actions";
import { useAuthStore } from "@/store/auth-store";
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
import { GoogleIcon } from "@/components/icons/google-icon";

export function LoginForm() {
  const router = useRouter();
  const setLogin = useAuthStore((state) => state.setLogin);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<IUserLoginSchema>({
    resolver: zodResolver(UserLoginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = async (data: IUserLoginSchema) => {
    try {
      setIsLoading(true);
      const response = await AuthActions.LoginAction(data);
      setLogin(response);
      toast.success(response.message || "Login successful");
      router.push("/");
    } catch (error: any) {
      // Check for nested error details first (e.g., from backend validation)
      const detailMsg = error.errors?.detail;
      toast.error(detailMsg || error.message || "Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2 text-left">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
          Welcome <span className="text-primary">Back</span>
        </h1>
        <p className="text-base text-muted-foreground font-medium opacity-70">
          Enter your credentials to access the terminal
        </p>
      </div>

      <div className="space-y-6">
        <Button
          variant="outline"
          className="w-full h-12 font-bold rounded-xl border-border bg-background transition-all hover:bg-muted/50 hover:border-primary/50 group"
          type="button"
        >
          <GoogleIcon className="mr-3 transition-transform group-hover:scale-110" />
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest text-muted-foreground">
            <span className="bg-background px-4">Or continue with mail</span>
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
                    Identifier
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Email or username"
                      className="h-12 rounded-xl bg-muted/20 border-border focus:ring-primary/20 transition-all text-base placeholder:text-muted-foreground/50"
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
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                      Password
                    </FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase"
                    >
                      Forgot?
                    </Link>
                  </div>
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
              className="w-full h-12 rounded-xl font-black text-sm uppercase tracking-widest bg-primary text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 mt-4 overflow-hidden group relative"
              disabled={isLoading}
            >
              <div className="absolute inset-0 bg-linear-to-r from-primary via-white/10 to-primary origin-left -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-3 border-primary-foreground border-t-transparent" />
                  Authenticating...
                </div>
              ) : (
                "Access Terminal"
              )}
            </Button>
          </form>
        </Form>
      </div>

      <div className="pt-4 space-y-4">
        <div className="flex items-center justify-center gap-4 opacity-20">
          <div className="h-px grow bg-border" />
          <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
            Institutional Grade Execution
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
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground opacity-70">
            Don&apos;t have a terminal account?{" "}
            <Link
              href="/register"
              className="text-primary font-bold hover:underline underline-offset-4"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
