"use client";

import { useForm } from "react-hook-form";
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
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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
      toast.success(response.message || "Password reset link sent");
      setIsSubmitted(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset link");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="mx-auto w-full max-w-md px-6">
        <div className="rounded-2xl border border-border/50 bg-card p-8 shadow-xl shadow-black/5 dark:shadow-black/20 backdrop-blur-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 mb-6">
            <IconMailCheck className="h-8 w-8 text-violet-600 dark:text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-3">
            Check Your Email
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            We&apos;ve sent a password reset link to your email address. Check
            your inbox and follow the instructions.
          </p>
          <Button
            asChild
            className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-violet-500/25"
          >
            <Link href="/login">Back to Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg px-6">
      <div className="rounded-2xl border border-border/50 bg-card p-8 sm:p-10 shadow-xl shadow-black/5 dark:shadow-black/20 backdrop-blur-sm">
        <div className="grid gap-3 text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
            <IconLock className="h-7 w-7 text-violet-600 dark:text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Forgot Password?
          </h1>
          <p className="text-sm text-muted-foreground">
            No worries — enter your email and we&apos;ll send you a reset link
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
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        </Form>
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
          >
            <IconChevronLeft className="mr-1 h-4 w-4" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
