import React from "react";

const TermsAndConditions = () => {
    return (
        <div className="min-h-screen bg-background text-foreground py-20 px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-4">
                <div className="space-y-4 border-b border-border/40 pb-0">
                    <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight text-foreground">
                        Terms of Service
                    </h1>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider">
                        Last Updated: {new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                <div className="space-y-4 text-lg leading-relaxed text-muted-foreground/90">
                    <p>
                        Welcome to <strong>CrypAlgos</strong>. These Terms of Service govern your access to and use of our AI-powered algorithmic trading platform, including our no-code strategy builder, backtesting engine, and automated execution services (collectively, the "<strong>Services</strong>").
                    </p>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-serif text-foreground">1. Description of Services</h2>
                        <p>
                            CrypAlgos provides a platform for designing, testing, and deploying automated trading strategies. Our services include:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Strategy Builder:</strong> A visual, flow-based interface and code-level tools for creating trading algorithms.</li>
                            <li><strong>Market Data:</strong> Real-time streaming of crypto market data from various exchanges.</li>
                            <li><strong>Execution Engine:</strong> Cloud-based microservices that execute trades on linked exchange accounts.</li>
                            <li><strong>AI Analytics:</strong> Automated analysis and performance insights for your strategies.</li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-serif text-foreground">2. User Responsibilities</h2>
                        <p>
                            By using CrypAlgos, you acknowledge that:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>You are solely responsible for the strategies you create and deploy.</li>
                            <li>You must maintain control over your exchange API keys and security.</li>
                            <li>Cryptocurrency trading involves significant risk, and you should only trade with funds you can afford to lose.</li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-serif text-foreground">3. No Financial Advice</h2>
                        <p>
                            The AI analysis, performance metrics, and educational materials provided by CrypAlgos are for informational purposes only. No aspect of the Services constitutes financial, investment, legal, or tax advice. The "AI-assisted" features are tools to help you understand market behavior and strategy mechanics, not recommendations to buy or sell specific assets.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-serif text-foreground">4. Platform Availability</h2>
                        <p>
                            While we utilize a high-performance, distributed architecture designed for high availability, we do not guarantee 100% uptime. Market volatility, exchange outages, or technical failures may impact trade execution. CrypAlgos is not liable for losses resulting from such interruptions.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-serif text-foreground">5. Intellectual Property</h2>
                        <p>
                            The CrypAlgos platform, including its AI models, interface designs, and underlying infrastructure code, is the property of CrypAlgos. You retain ownership of the specific trading logic and parameters of the strategies you create on the platform.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsAndConditions;
