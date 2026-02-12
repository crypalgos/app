import { cn } from "@/lib/utils";
import {
  IconAdjustmentsBolt,
  IconBrain,
  IconChartBar,
  IconCode,
  IconHeartRateMonitor,
  IconPlayerPlay,
  IconRobot,
  IconTerminal2,
} from "@tabler/icons-react";

export function GridView() {
  const features = [
    {
      title: "Visual No-Code Builder",
      description:
        "Design strategies with drag-and-drop — no programming needed.",
      icon: <IconTerminal2 />,
    },
    {
      title: "Pro-Code Strategy Support",
      description:
        "Full code editor for advanced quants who want total control.",
      icon: <IconCode />,
    },
    {
      title: "Instant Backtesting",
      description:
        "Test strategies against years of historical data in seconds.",
      icon: <IconPlayerPlay />,
    },
    {
      title: "AI Performance Insights",
      description: "Get AI-driven recommendations to optimize your strategy.",
      icon: <IconBrain />,
    },
    {
      title: "Automated Live Execution",
      description: "Deploy strategies that trade 24/7 — without emotions.",
      icon: <IconRobot />,
    },
    {
      title: "Risk & Portfolio Analytics",
      description:
        "Monitor risk exposure and track portfolio performance in real-time.",
      icon: <IconChartBar />,
    },
    {
      title: "Trade Without Emotions",
      description: "Eliminate fear, greed, and hesitation from every trade.",
      icon: <IconHeartRateMonitor />,
    },
    {
      title: "Data-Driven Decisions",
      description: "Every move backed by data, not gut feelings.",
      icon: <IconAdjustmentsBolt />,
    },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4  relative z-10 py-10 max-w-7xl mx-auto">
      {features.map((feature, index) => (
        <Feature key={feature.title} {...feature} index={index} />
      ))}
    </div>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r  py-10 relative group/feature dark:border-neutral-800",
        (index === 0 || index === 4) && "lg:border-l dark:border-neutral-800",
        index < 4 && "lg:border-b dark:border-neutral-800",
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-neutral-600 dark:text-neutral-400">
        {icon}
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-300 dark:bg-neutral-700 group-hover/feature:bg-blue-500 dark:group-hover/feature:bg-blue-500 transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-neutral-800 dark:text-neutral-100">
          {title}
        </span>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  );
};
