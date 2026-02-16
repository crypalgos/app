import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Calendar, LucideIcon, MapIcon } from "lucide-react";
import Image from "next/image";
import { ReactNode } from "react";

export default function FeaturesSection() {
  return (
    <section className="bg-background py-10 md:py-16 border-y border-border/20">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-5 lg:px-8">
        <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-2">
          <FeatureCard>
            <CardHeader className="pb-3">
              <CardHeading
                icon={MapIcon}
                title="Visual Strategy Builder"
                description="Build trading strategies with a no-code drag-and-drop interface — no coding required."
              />
            </CardHeader>

            <div className="relative border-t border-border border-dashed max-sm:mb-6">
              <div
                aria-hidden
                className="absolute inset-0 [background:radial-gradient(125%_125%_at_50%_0%,transparent_40%,var(--color-primary),transparent_100%)] opacity-20"
              />
              <div className="relative h-64 w-full px-6 pt-6 sm:h-80 lg:aspect-4/3">
                <DualModeImage
                  darkSrc="/payments.png"
                  lightSrc="/payments-light.png"
                  alt="payments illustration"
                  width={1207}
                  height={929}
                  className="object-contain h-full w-full"
                />
              </div>
            </div>
          </FeatureCard>

          <FeatureCard>
            <CardHeader className="pb-3">
              <CardHeading
                icon={Calendar}
                title="Instant Backtesting"
                description="Test your strategies against historical data in seconds and refine before going live."
              />
            </CardHeader>

            <CardContent>
              <div className="mask-radial-at-right mask-radial-from-75% mask-radial-[75%_75%] relative max-sm:mb-6">
                <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-border sm:h-80 lg:aspect-4/3">
                  <DualModeImage
                    darkSrc="/origin-cal-dark.png"
                    lightSrc="/origin-cal.png"
                    alt="calendar illustration"
                    width={1207}
                    height={929}
                    className="object-cover h-full w-full"
                  />
                </div>
              </div>
            </CardContent>
          </FeatureCard>

          <FeatureCard className="p-4 sm:p-6 sm:col-span-2 lg:col-span-2">
            <p className="mx-auto my-4 sm:my-6 max-w-md text-balance text-center text-lg sm:text-2xl font-semibold">
              From idea to live trading in minutes — powered by AI insights and
              real-time data.
            </p>

            <div className="flex justify-center gap-3 sm:gap-6 overflow-hidden">
              <CircularUI
                label="Build"
                circles={[{ pattern: "border" }, { pattern: "border" }]}
              />

              <CircularUI
                label="Test"
                circles={[{ pattern: "none" }, { pattern: "primary" }]}
              />

              <CircularUI
                label="Deploy"
                circles={[{ pattern: "blue" }, { pattern: "none" }]}
              />

              <CircularUI
                label="Optimize"
                circles={[{ pattern: "primary" }, { pattern: "none" }]}
                className="hidden sm:block"
              />
            </div>
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  children: ReactNode;
  className?: string;
}

const FeatureCard = ({ children, className }: FeatureCardProps) => (
  <Card
    className={cn(
      "group relative rounded-[2rem] border-border bg-card/50 backdrop-blur-sm shadow-sm transition-all duration-300 ease-out overflow-hidden",
      "hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20",
      className,
    )}
  >
    <CardDecorator />
    {children}
  </Card>
);

const CardDecorator = () => (
  <>
    <span className="border-primary absolute -left-px -top-px block size-2 border-l-2 border-t-2"></span>
    <span className="border-primary absolute -right-px -top-px block size-2 border-r-2 border-t-2"></span>
    <span className="border-primary absolute -bottom-px -left-px block size-2 border-b-2 border-l-2"></span>
    <span className="border-primary absolute -bottom-px -right-px block size-2 border-b-2 border-r-2"></span>
  </>
);

interface CardHeadingProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const CardHeading = ({ icon: Icon, title, description }: CardHeadingProps) => (
  <div className="p-4 sm:p-6">
    <span className="text-muted-foreground flex items-center gap-2">
      <Icon className="size-4" />
      {title}
    </span>
    <p className="mt-6 sm:mt-8 text-xl sm:text-2xl font-semibold">
      {description}
    </p>
  </div>
);

interface DualModeImageProps {
  darkSrc: string;
  lightSrc: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

const DualModeImage = ({
  darkSrc,
  lightSrc,
  alt,
  width,
  height,
  className,
}: DualModeImageProps) => (
  <>
    <Image
      src={darkSrc}
      className={cn("hidden dark:block", className)}
      alt={`${alt} dark`}
      width={width}
      height={height}
    />
    <Image
      src={lightSrc}
      className={cn("shadow dark:hidden", className)}
      alt={`${alt} light`}
      width={width}
      height={height}
    />
  </>
);

interface CircleConfig {
  pattern: "none" | "border" | "primary" | "blue";
}

interface CircularUIProps {
  label: string;
  circles: CircleConfig[];
  className?: string;
}

const CircularUI = ({ label, circles, className }: CircularUIProps) => (
  <div className={className}>
    <div className="bg-linear-to-b from-border size-fit rounded-2xl to-transparent p-px">
      <div className="bg-linear-to-b from-background to-muted/25 relative flex aspect-square w-fit items-center -space-x-4 rounded-[15px] p-4">
        {circles.map((circle, i) => (
          <div
            key={i}
            className={cn(
              "size-7 rounded-full border sm:size-8 transition-colors duration-300",
              {
                "border-primary bg-primary/10": circle.pattern === "none",
                "border-primary/40 bg-[repeating-linear-gradient(-45deg,var(--color-border),var(--color-border)_1px,transparent_1px,transparent_4px)]":
                  circle.pattern === "border",
                "border-primary bg-primary/20 bg-[repeating-linear-gradient(-45deg,var(--color-primary),var(--color-primary)_1px,transparent_1px,transparent_4px)]":
                  circle.pattern === "primary",
                "border-accent bg-accent/20 bg-[repeating-linear-gradient(-45deg,var(--color-accent),var(--color-accent)_1px,transparent_1px,transparent_4px)]":
                  circle.pattern === "blue",
              },
            )}
          ></div>
        ))}
      </div>
    </div>
    <span className="text-muted-foreground mt-1.5 block text-center text-sm">
      {label}
    </span>
  </div>
);
