"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowRight, AlertCircle, Check, Lock, MailCheck } from "lucide-react";

import { AuthActions } from "@/api-actions/auth-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup, Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const WaitlistSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
});

type IWaitlistSchema = z.infer<typeof WaitlistSchema>;

const perks = [
  "Priority access when we open invitations",
  "Institutional-grade algo trading infrastructure",
  "Sub-millisecond execution engine",
];

export default function WaitlistPage() {
  const [success, setSuccess] = useState(false);
  const [alreadyOnList, setAlreadyOnList] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<IWaitlistSchema>({
    resolver: zodResolver(WaitlistSchema),
    defaultValues: { name: "", email: "" },
  });

  const onSubmit = async (data: IWaitlistSchema) => {
    setGlobalError(null);
    setAlreadyOnList(false);
    try {
      await AuthActions.JoinWaitlistAction(data);
      setSuccess(true);
    } catch (error: any) {
      const message: string = error.message || "Something went wrong. Please try again.";

      // Detect duplicate — show a friendlier inline state instead of a red alert
      if (
        error?.status === 409 ||
        error?.response?.status === 409 ||
        message.toLowerCase().includes("already registered") ||
        message.toLowerCase().includes("already on the waitlist")
      ) {
        setAlreadyOnList(true);
      } else {
        setGlobalError(message);
      }
    }
  };

  if (success) {
    return (
      <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Success state */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Check className="size-4 text-primary" />
            </div>
            <Badge variant="secondary" className="text-xs font-medium">
              Spot reserved
            </Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            You&apos;re on the list.
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mt-1">
            We&apos;ve reserved a spot for{" "}
            <span className="text-foreground font-medium">{getValues("email")}</span>.
            We&apos;ll reach out as soon as invitations open — keep an eye on your inbox.
          </p>
        </div>

        <Separator />

        <div className="flex flex-col gap-3">
          {perks.map((perk) => (
            <div key={perk} className="flex items-start gap-2.5">
              <div className="size-4 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mt-0.5 shrink-0">
                <Check className="size-2.5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">{perk}</span>
            </div>
          ))}
        </div>

        <Button asChild variant="outline" className="w-full h-10">
          <Link href="https://crypalgos.com">Back to homepage</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Badge variant="secondary" className="w-fit text-xs font-medium mb-1">
          Private pre-launch
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight">
          Request early access
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          CrypAlgos is in private beta. Leave your details and we&apos;ll reach
          out when your invitation is ready.
        </p>
      </div>

      {/* What you get */}
      <div className="flex flex-col gap-2.5">
        {perks.map((perk) => (
          <div key={perk} className="flex items-start gap-2.5">
            <div className="size-4 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mt-0.5 shrink-0">
              <Check className="size-2.5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">{perk}</span>
          </div>
        ))}
      </div>

      <Separator />

      {/* Already on waitlist */}
      {alreadyOnList && (
        <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <MailCheck className="size-4 text-primary mt-0.5 shrink-0" />
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-foreground">
              You&apos;re already on the list
            </p>
            <p className="text-xs text-muted-foreground">
              This email is already registered. We&apos;ll be in touch when your
              invitation is ready.
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {globalError && (
        <Alert
          variant="destructive"
          className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg py-3"
        >
          <AlertCircle className="size-4" />
          <AlertDescription className="ml-2 text-sm font-medium">
            {globalError}
          </AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <FieldGroup>
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">Full name</FieldLabel>
            <Input
              id="name"
              placeholder="Jane Smith"
              className="h-10"
              {...register("name")}
              aria-invalid={!!errors.name}
              disabled={isSubmitting}
            />
            <FieldError errors={[errors.name]} />
          </Field>

          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">Work email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="jane@fund.com"
              className="h-10"
              {...register("email")}
              aria-invalid={!!errors.email}
              disabled={isSubmitting}
            />
            <FieldError errors={[errors.email]} />
          </Field>
        </FieldGroup>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 font-medium"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
              Submitting...
            </>
          ) : (
            <>
              Request access
              <ArrowRight className="size-4" data-icon="inline-end" />
            </>
          )}
        </Button>
      </form>

      {/* Footer note */}
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="size-3 shrink-0" />
        Your information is never shared with third parties.
      </p>
    </div>
  );
}
