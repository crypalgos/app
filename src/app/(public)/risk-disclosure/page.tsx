import React from "react";

const RiskDisclosure = () => {
    return (
        <div className="min-h-screen bg-background text-foreground py-20 px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-4">
                <div className="space-y-4 border-b border-border/40 pb-0">
                    <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight text-foreground">
                        Risk Disclosure
                    </h1>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider">
                        Critical Information for Traders
                    </p>
                </div>

                <div className="space-y-4 text-lg leading-relaxed text-muted-foreground/90">
                    <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-lg">
                        <p className="font-semibold text-red-500 mb-2">High Risk Warning:</p>
                        <p>
                            Trading cryptocurrencies and digital assets involves a high level of risk and may not be suitable for all investors. The high degree of leverage and market volatility can work against you as well as for you.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-serif text-foreground">1. Algorithmic Trading Risks</h2>
                        <p>
                            Using an automated trading system involves specific risks, including but not limited to:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Technical Failures:</strong> Internet connectivity issues, exchange API downtime, or software bugs may prevent orders from being executed or cancelled.</li>
                            <li><strong>Over-Optimization:</strong> Strategies that perform well in backtesting (using historical data) may fail to perform similarly in live market conditions.</li>
                            <li><strong>Latency:</strong> Delays in data processing or order execution may result in slippage, where the execution price differs from the expected price.</li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-serif text-foreground">2. AI & Machine Learning Limitations</h2>
                        <p>
                            Our AI-assisted features provide probabilistic analysis based on historical patterns. AI predictions are not guarantees of future market behavior. The "intelligent analytics" provided by the platform should be used as a support tool, not the sole basis for trading decisions.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-serif text-foreground">3. Crypto Market Risks</h2>
                        <p>
                            Cryptocurrency markets are decentralized and non-regulated. They are operational 24/7 and can experience extreme price swats in short periods. CrypAlgos is not responsible for losses due to market manipulation, flash crashes, or liquidity crises on connected exchanges.
                        </p>
                    </div>

                    <p>
                        You acknowledge that you are solely responsible for monitoring your automated strategies and risk controls. We strongly recommend testing all strategies in our supported sandbox/paper-trading environments before live deployment.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RiskDisclosure;
