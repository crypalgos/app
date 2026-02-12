"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import Link from "next/link";

type FAQItem = {
  id: string;
  icon: IconName;
  question: string;
  answer: string;
};

export default function FAQsThree() {
  const faqItems: FAQItem[] = [
    {
      id: "item-1",
      icon: "terminal",
      question: "What is CrypAlgos?",
      answer:
        "CrypAlgos is an AI-powered algorithmic trading platform that allows you to create, backtest, and deploy trading strategies across multiple crypto exchanges without writing complex code.",
    },
    {
      id: "item-2",
      icon: "zap",
      question: "How fast are the trade executions?",
      answer:
        "Our infrastructure is optimized for high-frequency trading with sub-millisecond execution times. We use direct websocket connections to major exchanges to ensure minimum latency.",
    },
    {
      id: "item-3",
      icon: "shield-check",
      question: "Is my data and API keys secure?",
      answer:
        "Security is our top priority. All API keys are encrypted using AES-256 at the hardware level. We never have access to your withdrawal permissions, only trading.",
    },
    {
      id: "item-4",
      icon: "bar-chart-3",
      question: "Which exchanges do you support?",
      answer:
        "We currently support all major exchanges including Binance, Coinbase, Bybit, OKX, and Kraken. We are constantly adding support for new platforms based on user demand.",
    },
    {
      id: "item-5",
      icon: "cpu",
      question: "Do I need coding skills to use CrypAlgos?",
      answer:
        "No! You can build strategies using our visual drag-and-drop editor. For advanced users, we also provide a Python SDK for creating custom complex algorithms.",
    },
  ];

  return (
    <section className="bg-background dark:bg-background py-24 border-y border-border/40">
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        <div className="flex flex-col items-center gap-12 text-center">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
              Everything you need to know about our platform. Can't find it
              here? Contact our{" "}
              <Link
                href="#"
                className="text-primary font-semibold hover:underline decoration-2 underline-offset-4"
              >
                support team
              </Link>
            </p>
          </div>
          <div className="w-full">
            <Accordion type="single" collapsible className="w-full space-y-3">
              {faqItems.map((item) => (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                  className="group bg-card hover:bg-muted/30 dark:hover:bg-muted/10 transition-all duration-200 shadow-sm hover:shadow-md rounded-xl border-border/60 px-5 last:border-b text-left"
                >
                  <AccordionTrigger className="cursor-pointer items-center py-6 hover:no-underline">
                    <div className="flex items-center gap-4">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-data-[state=open]:bg-primary group-data-[state=open]:text-white transition-colors duration-200 shrink-0">
                        <DynamicIcon name={item.icon} className="size-5" />
                      </div>
                      <span className="text-lg font-medium tracking-tight whitespace-normal">
                        {item.question}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <div className="pl-14 pr-4">
                      <p className="text-muted-foreground text-lg leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
