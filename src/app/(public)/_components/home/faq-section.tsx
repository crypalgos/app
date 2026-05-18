"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";

type FAQItem = {
  id: string;
  question: string;
  answer: string;
};

const faqItems: FAQItem[] = [
  {
    id: "item-1",
    question: "What is CrypAlgos?",
    answer:
      "CrypAlgos is an AI-powered algorithmic trading platform that allows you to create, backtest, and deploy trading strategies across multiple crypto exchanges without writing complex code.",
  },
  {
    id: "item-2",
    question: "How fast are the trade executions?",
    answer:
      "Our infrastructure is optimized for high-frequency trading with sub-millisecond execution times. We use direct websocket connections to major exchanges to ensure minimum latency.",
  },
  {
    id: "item-3",
    question: "Is my data and API keys secure?",
    answer:
      "Security is our top priority. All API keys are encrypted using AES-256 at the hardware level. We never have access to your withdrawal permissions, only trading.",
  },
  {
    id: "item-4",
    question: "Which exchanges do you support?",
    answer:
      "We currently support all major exchanges including Binance, Coinbase, Bybit, OKX, and Kraken. We are constantly adding support for new platforms based on user demand.",
  },
  {
    id: "item-5",
    question: "Do I need coding skills to use CrypAlgos?",
    answer:
      "No! You can build strategies using our visual drag-and-drop editor. For advanced users, we also provide a Python SDK for creating custom complex algorithms.",
  },
];

export default function FAQsThree() {
  return (
    <section className="bg-background py-10 md:py-16 border-y border-border/30">
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        <div className="flex flex-col items-center gap-10 text-center">
          {/* Header */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 text-xs font-medium text-muted-foreground mb-6">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              FAQ
            </div>
            <h2 className="text-3xl md:text-5xl font-medium tracking-tighter leading-[1.1] mb-4">
              Frequently asked
              <br />
              <span className="text-primary">questions.</span>
            </h2>
            <p className="text-muted-foreground text-lg font-light leading-relaxed">
              Everything you need to know about our platform. Can&apos;t find it
              here? Contact our{" "}
              <Link
                href="/contact"
                className="text-primary font-medium hover:underline decoration-2 underline-offset-4 transition-colors"
              >
                support team
              </Link>
            </p>
          </div>

          {/* Accordion */}
          <div className="w-full max-w-3xl mx-auto text-left">
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item) => (
                <AccordionItem key={item.id} value={item.id}>
                  <AccordionTrigger className="text-base md:text-lg font-medium">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm md:text-base leading-relaxed">
                    {item.answer}
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
