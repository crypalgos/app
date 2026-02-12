"use client";

import { useForm } from "react-hook-form";
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
import { IconBrandGoogle } from "@tabler/icons-react";

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
    <div className="mx-auto w-full min-w-lg px-6">
      <div className="rounded-2xl border border-border/50 bg-card p-8 sm:p-10 shadow-xl shadow-black/5 dark:shadow-black/20 backdrop-blur-sm">
        <div className="grid gap-3 text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Create Your Account
          </h1>
          <p className="text-sm text-muted-foreground">
            Start building automated trading strategies today
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
              or sign up with email
            </span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
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
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Username
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="johndoe"
                        className="h-11 rounded-xl bg-muted/50 border-border/50 focus:bg-background transition-colors"
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
                <FormItem>
                  <FormLabel className="text-sm font-medium">Email</FormLabel>
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
                  <FormLabel className="text-sm font-medium">
                    Password
                  </FormLabel>
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
              className="w-full h-11 mt-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-violet-500/25 transition-all duration-200 hover:shadow-violet-500/40 hover:-translate-y-0.5"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        </Form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
