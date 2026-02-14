import React from "react";

const ReturnPolicy = () => {
    return (
        <div className="min-h-screen bg-background text-foreground py-20 px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="space-y-4 border-b border-border/40 pb-0">
                    <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight text-foreground">
                        Return & Refund Policy
                    </h1>
                </div>

                <div className="space-y-4 text-lg leading-relaxed text-muted-foreground/90">
                    <p>
                        CrypAlgos is dedicated to providing a professional-grade trading ecosystem. As our platform offers immediate access to digital tools, data, and analytical resources, our refund policy is structured as follows:
                    </p>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-serif text-foreground">Subscription Services</h2>
                        <p>
                            CrypAlgos operates on a subscription basis (e.g., Monthly or Annual plans).
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Cancellations:</strong> You may cancel your subscription at any time. Your access will continue until the end of the current billing cycle.</li>
                            <li><strong>No Partial Refunds:</strong> We generally do not offer refunds for partial subscription periods or unused time.</li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-serif text-foreground">14-Day Satisfaction Guarantee</h2>
                        <p>
                            For new users on their first subscription, we offer a 14-day refund window if you are not satisfied with the platform. To request a refund, you must contact support within 14 days of your initial purchase.
                        </p>
                        <p className="text-sm italic">
                            Note: This guarantee does not apply if valid evidence suggests significant usage of the platform's live execution features for volume trading during this period.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-2xl font-serif text-foreground">Contact Us</h2>
                        <p>
                            If you believe you have been billed in error or have a specific issue with your service, please contact our billing team at billing@crypalgos.com.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReturnPolicy;
