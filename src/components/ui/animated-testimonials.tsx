import { cn } from "@/lib/utils";

interface Testimonial {
  name: string;
  image: string;
  description: string;
  handle: string;
}

interface AnimatedCanopyProps extends React.HTMLAttributes<HTMLDivElement> {
  vertical?: boolean;
  repeat?: number;
  reverse?: boolean;
  pauseOnHover?: boolean;
  applyMask?: boolean;
}

const AnimatedCanopy = ({
  children,
  vertical = false,
  repeat = 4,
  pauseOnHover = false,
  reverse = false,
  className,
  applyMask = true,
  ...props
}: AnimatedCanopyProps) => (
  <div
    {...props}
    className={cn(
      "group relative flex h-fit w-full overflow-hidden p-2 [--duration:10s] [--gap:12px] gap-(--gap)",
      vertical ? "flex-col" : "flex-row",
      className,
    )}
  >
    {Array.from({ length: repeat }).map((_, index) => (
      <div
        key={`item-${index}`}
        className={cn("flex shrink-0 gap-(--gap)", {
          "group-hover:paused": pauseOnHover,
          "direction-reverse": reverse,
          "animate-canopy-horizontal flex-row": !vertical,
          "animate-canopy-vertical flex-col": vertical,
        })}
      >
        {children}
      </div>
    ))}
    {applyMask && (
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-10 h-full w-full from-background/80 from-5% via-transparent via-50% to-background/80 to-95%",
          vertical ? "bg-linear-to-b" : "bg-linear-to-r",
        )}
      />
    )}
  </div>
);

const TestimonialCard = ({
  testimonial,
  className,
}: {
  testimonial: Testimonial;
  className?: string;
}) => (
  <div
    className={cn(
      "group mx-2 flex h-32 w-80 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-border/40 bg-card/50 p-3 transition-all duration-300 hover:border-primary/40 hover:bg-card hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5",
      className,
    )}
  >
    <div className="flex items-start gap-3 relative">
      {/* Subtle quote mark */}
      <span className="absolute -top-1 -left-0.5 text-3xl leading-none text-primary/10 font-serif select-none pointer-events-none">&ldquo;</span>
      <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-border/60 ring-2 ring-primary/10 mt-1">
        <img
          src={testimonial.image}
          alt={testimonial.name}
          className="h-full w-full not-prose object-cover"
        />
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-foreground">
            {testimonial.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {testimonial.handle}
          </span>
        </div>
        <p className="mt-1 line-clamp-3 text-sm text-muted-foreground leading-relaxed">
          {testimonial.description}
        </p>
      </div>
    </div>
  </div>
);

export const AnimatedTestimonials = ({
  data,
  className,
  cardClassName,
}: {
  data: Testimonial[];
  className?: string;
  cardClassName?: string;
}) => (
  <div className={cn("w-full overflow-x-hidden py-4", className)}>
    {[false, true, false].map((reverse, index) => (
      <AnimatedCanopy
        key={`Canopy-${index}`}
        reverse={reverse}
        className="[--duration:60s]"
        pauseOnHover
        applyMask={false}
        repeat={3}
      >
        {data.map((testimonial) => (
          <TestimonialCard
            key={testimonial.name}
            testimonial={testimonial}
            className={cardClassName}
          />
        ))}
      </AnimatedCanopy>
    ))}
  </div>
);
