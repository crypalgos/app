"use client";

import ScrollStack, { ScrollStackItem } from "@/components/ui/scrollstack";

export default function ScrollStackDemo() {
    return (
        <div className="h-[500px] w-full relative">
            <ScrollStack>
                <ScrollStackItem itemClassName="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                    <h2 className="text-2xl font-bold mb-4">Visual Strategy Builder</h2>
                    <p className="text-muted-foreground">
                        Build trading strategies with a no-code drag-and-drop interface — no
                        coding required.
                    </p>
                </ScrollStackItem>
                <ScrollStackItem itemClassName="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                    <h2 className="text-2xl font-bold mb-4">Instant Backtesting</h2>
                    <p className="text-muted-foreground">
                        Test your strategies against historical data in seconds and refine
                        before going live.
                    </p>
                </ScrollStackItem>
                <ScrollStackItem itemClassName="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                    <h2 className="text-2xl font-bold mb-4">Automated Execution</h2>
                    <p className="text-muted-foreground">
                        Deploy your strategies to trade 24/7 on major exchanges with
                        institutional-grade reliability.
                    </p>
                </ScrollStackItem>
            </ScrollStack>
        </div>
    );
}