"use client";

import { useForm } from "react-hook-form";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UserRegistrationSchema,
  IUserRegistrationSchema,
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
import { GoogleIcon } from "@/components/icons/google-icon";

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<IUserRegistrationSchema>({
    resolver: zodResolver(UserRegistrationSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: IUserRegistrationSchema) => {
    try {
      setIsLoading(true);
      const response = await AuthActions.RegisterAction(data);
      toast.success(response.message || "Registration successful");
      router.push(`/verify?identifier=${encodeURIComponent(data.email)}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to register");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2 text-left">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
          Create <span className="text-primary">Account</span>
        </h1>
        <p className="text-base text-muted-foreground font-medium opacity-70">
          Join the elite circle of technical traders
        </p>
      </div>

      <div className="space-y-4">
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
            <span className="bg-background px-4">Or sign up with email</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        className="h-12 rounded-xl bg-muted/20 border-border focus:ring-primary/20 transition-all text-sm placeholder:text-muted-foreground/50"
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
                name="username"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">
                      Username
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="johndoe"
                        className="h-12 rounded-xl bg-muted/20 border-border focus:ring-primary/20 transition-all text-sm placeholder:text-muted-foreground/50"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="name@example.com"
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
                  <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 ml-1">
                    Password
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
              className="w-full h-12 rounded-xl font-black text-sm uppercase tracking-widest bg-primary text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 mt-4 overflow-hidden group relative"
              disabled={isLoading}
            >
              <div className="absolute inset-0 bg-linear-to-r from-primary via-white/10 to-primary origin-left -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-3 border-primary-foreground border-t-transparent" />
                  Building Account...
                </div>
              ) : (
                "Join the Network"
              )}
            </Button>
          </form>
        </Form>
      </div>

      <div className="pt-3 space-y-3">
        <div className="flex items-center justify-center gap-4 opacity-20">
          <div className="h-px grow bg-border" />
          <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
            Trade Leading Assets
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
            Already have a terminal account?{" "}
            <Link
              href="/login"
              className="text-primary font-bold hover:underline underline-offset-4"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
