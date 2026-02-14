import React from "react";

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-background text-foreground py-20 px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-4">
                {/* Header Section */}
                <div className="space-y-4 border-b border-border/40 pb-0">
                    <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight text-foreground">
                        Privacy Policy
                    </h1>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider">
                        Last Updated: {new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {/* Content Section */}
                <div className="space-y-4 text-lg leading-relaxed text-muted-foreground/90">
                    <p>
                        At <strong>CrypAlgos</strong> ("we," "our," or "us"), we are committed to protecting your privacy while you use our next-generation, AI-powered algorithmic trading platform. This Privacy Policy explains how we collect, use, disclosure, and safeguard your information when you access our ecosystem, including our no-code strategy builder, real-time analytics, and automated execution services.
                    </p>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-serif text-foreground">1. Information We Collect</h2>
                        <p>
                            To provide our institutional-grade infrastructure and AI-assisted features, we may collect the following types of information:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Account Information:</strong> Name, email address, and authentication credentials.</li>
                            <li><strong>Trading Data:</strong> API keys (encrypted and securely stored), transaction history, and exchange account balances needed for automated execution.</li>
                            <li><strong>Strategy Data:</strong> Logic, parameters, and configurations of the trading strategies you build using our visual flow-based interface or code-level tools.</li>
                            <li><strong>Usage Analytics:</strong> Data on how you interact with our AI analysis tools, backtesting engine, and real-time dashboards.</li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-serif text-foreground">2. How We Use Your Information</h2>
                        <p>
                            We use the collected data to:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Execute Trades:</strong> Securely transmit orders to cryptocurrency exchanges on your behalf via our high-performance microservice architecture.</li>
                            <li><strong>AI Analysis:</strong> Process your strategies through our AI layer to provide specific performance insights, explain trading decisions, and suggest improvements.</li>
                            <li><strong>Platform Optimization:</strong> Analyze aggregate usage patterns to scale our cloud-native infrastructure and prevent bottlenecks.</li>
                            <li><strong>Risk Management:</strong> Monitor valid API connections and enforce platform-level risk controls.</li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-serif text-foreground">3. Data Security & Architecture</h2>
                        <p>
                            Security is paramount in our scalable cloud-native infrastructure. We employ:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Encryption:</strong> All sensitive data, especially API keys, are encrypted at rest and in transit.</li>
                            <li><strong>Microservice Isolation:</strong> Our distributed services architecture ensures that individual component failures do not compromise the integrity of your data.</li>
                            <li><strong>Strict Access Controls:</strong> We implement rigorous internal access protocols to prevent unauthorized access to user strategies and trading data.</li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-serif text-foreground">4. AI & Strategy Confidentiality</h2>
                        <p>
                            We understand that your trading strategies are your intellectual property. Our AI layer analyzes strategies solely to provide <em>you</em> with feedback and explanations. We do not share, sell, or replicate your proprietary strategy logic for our own trading purposes.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-serif text-foreground">5. Contact Us</h2>
                        <p>
                            If you have questions about how we handle data in our algorithmic trading ecosystem, please contact us at support@crypalgos.com.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
