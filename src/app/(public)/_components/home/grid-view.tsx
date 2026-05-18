import { cn } from "@/lib/utils";
import {
  IconTerminal2,
  IconCode,
  IconPlayerPlay,
  IconBrain,
  IconRobot,
  IconChartBar,
  IconHeartRateMonitor,
  IconAdjustmentsBolt,
} from "@tabler/icons-react";

const features = [
  {
    title: "Visual No-Code Builder",
    description:
      "Design strategies with drag-and-drop — no programming needed.",
    icon: IconTerminal2,
  },
  {
    title: "Pro-Code Strategy Support",
    description: "Full code editor for advanced quants who want total control.",
    icon: IconCode,
  },
  {
    title: "Instant Backtesting",
    description: "Test strategies against years of historical data in seconds.",
    icon: IconPlayerPlay,
  },
  {
    title: "AI Performance Insights",
    description: "Get AI-driven recommendations to optimize your strategy.",
    icon: IconBrain,
  },
  {
    title: "Automated Live Execution",
    description: "Deploy strategies that trade 24/7 — without emotions.",
    icon: IconRobot,
  },
  {
    title: "Risk & Portfolio Analytics",
    description:
      "Monitor risk exposure and track portfolio performance in real-time.",
    icon: IconChartBar,
  },
  {
    title: "Trade Without Emotions",
    description: "Eliminate fear, greed, and hesitation from every trade.",
    icon: IconHeartRateMonitor,
  },
  {
    title: "Data-Driven Decisions",
    description: "Every move backed by data, not gut feelings.",
    icon: IconAdjustmentsBolt,
  },
];

export function GridView() {
  return (
    <section className="relative py-10 md:py-16 border-y border-border/30">
      {/* Section header */}
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 mb-10 md:mb-14">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 text-xs font-medium text-muted-foreground mb-5">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-chart-3 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-chart-3" />
            </span>
            Capabilities
          </div>
          <h2 className="text-3xl md:text-5xl font-medium tracking-tighter leading-[1.1] mb-4">
            Everything you need.
            <br />
            <span className="text-primary">Nothing you don&apos;t.</span>
          </h2>
        </div>
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 relative z-10 max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        {features.map((feature, index) => (
          <Feature key={feature.title} {...feature} index={index} />
        ))}
      </div>
    </section>
  );
}

function Feature({
  title,
  description,
  icon: Icon,
  index,
}: {
  title: string;
  description: string;
  icon: typeof IconTerminal2;
  index: number;
}) {
  return (
    <div
      className={cn(
        "flex flex-col py-10 relative group/feature border-border/30",
        "lg:border-r",
        (index === 0 || index === 4) && "lg:border-l",
        index < 4 && "lg:border-b",
      )}
    >
      {/* Hover gradient overlay */}
      {index < 4 ? (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-300 absolute inset-0 h-full w-full bg-gradient-to-t from-muted/60 to-transparent pointer-events-none" />
      ) : (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-300 absolute inset-0 h-full w-full bg-gradient-to-b from-muted/60 to-transparent pointer-events-none" />
      )}

      {/* Icon — transitions to primary on hover */}
      <div className="mb-4 relative z-10 px-6 md:px-10 text-muted-foreground group-hover/feature:text-primary transition-colors duration-300">
        <Icon
          className="size-5 transition-transform duration-300 group-hover/feature:scale-110"
          strokeWidth={1.5}
        />
      </div>

      {/* Title with accent bar */}
      <div className="text-sm font-semibold mb-2 relative z-10 px-6 md:px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-border group-hover/feature:bg-primary transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-1.5 transition-transform duration-200 inline-block text-foreground">
          {title}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground max-w-xs relative z-10 px-6 md:px-10 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
