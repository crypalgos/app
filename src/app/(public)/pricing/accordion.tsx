import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

export function AccordionFAQ() {
    return (
        <div className="w-full max-w-3xl mx-auto py-16 px-4">
            <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                    <AccordionTrigger>How secure are the exchange API connections?</AccordionTrigger>
                    <AccordionContent>
                        We use industry-standard encryption for all API keys. Your keys are stored in a secure, encrypted vault and never shared with third parties. We also recommend using "read-only" or "trade-only" permissions, disabling withdrawal permissions for maximum security.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                    <AccordionTrigger>Can I backtest my strategies before trading live?</AccordionTrigger>
                    <AccordionContent>
                        Yes, absolutely. All plans include backtesting capabilities. You can test your strategies against historical market data to verify their performance before risking real capital. The Pro and Power plans offer unlimited backtesting with priority execution speeds.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                    <AccordionTrigger>What exchanges do you support?</AccordionTrigger>
                    <AccordionContent>
                        We support major global exchanges including Binance, Coinbase Pro, Kraken, Bybit, KuCoin, and OKX. We regularly add support for new exchanges based on community demand and liquidity requirements.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                    <AccordionTrigger>Do I need coding skills to use the trading bots?</AccordionTrigger>
                    <AccordionContent>
                        No coding skills are required. We offer a visual strategy builder and pre-configured templates for common strategies like Grid, DCA, and RSI. However, for advanced users, we also provide a Python SDK to script custom logic.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                    <AccordionTrigger>What happens if I upgrade or downgrade my plan?</AccordionTrigger>
                    <AccordionContent>
                        Plan changes are prorated. If you upgrade, you'll be charged the difference for the remainder of the billing cycle and get instant access to new features. If you downgrade, the new rate applies at the start of the next billing cycle.
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}
