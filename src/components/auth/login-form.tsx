"use client";

import { useForm } from "react-hook-form";
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
import { IconBrandGoogle } from "@tabler/icons-react";

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
      toast.error(error.message || "Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full min-w-lg px-6">
      <div className="rounded-2xl border border-border/50 bg-card p-8 sm:p-10 shadow-xl shadow-black/5 dark:shadow-black/20 backdrop-blur-sm">
        <div className="grid gap-3 text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your trading dashboard
          </p>
        </div>

        {/* Google OAuth */}
        <Button
          variant="outline"
          className="w-full h-11 font-medium mb-6 rounded-xl"
          type="button"
        >
          <IconBrandGoogle className="mr-2 h-5 w-5" />
          Continue with Google
        </Button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-3 text-muted-foreground">
              or sign in with email
            </span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <FormLabel className="text-sm font-medium">
                      Password
                    </FormLabel>
                    <Link
                      href="/forgot-password"
                      className="ml-auto text-xs text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
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
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </Form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
