"use client";

import { useState, Fragment } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const featureCategories = [
    {
        id: "trading",
        name: "Trading Features",
        features: [
            {
                name: "Exchange Connections",
                free: "1",
                starter: "3",
                pro: "10",
                power: "Unlimited",
            },
            {
                name: "Live Trading Bots",
                free: "1",
                starter: "5",
                pro: "20",
                power: "Unlimited",
            },
            {
                name: "Backtesting Strategy",
                free: "Daily Limit",
                starter: "Priority",
                pro: "Unlimited",
                power: "Unlimited",
            },
            {
                name: "Paper Trading",
                free: true,
                starter: true,
                pro: true,
                power: true,
            },
        ],
    },
    {
        id: "advanced",
        name: "Advanced Tools",
        features: [
            {
                name: "AI Strategy Optimization",
                free: false,
                starter: true,
                pro: true,
                power: true,
            },
            {
                name: "Technical Indicators",
                free: "Standard",
                starter: "All + Custom",
                pro: "All + Proprietary",
                power: "All + Proprietary",
            },
            {
                name: "Portfolio Analytics",
                free: "Basic",
                starter: "Advanced",
                pro: "Real-time",
                power: "Real-time + AI",
            },
            {
                name: "Webhook Alerts",
                free: "5",
                starter: "20",
                pro: "100",
                power: "Unlimited",
            },
        ],
    },
    {
        id: "support",
        name: "Support & Security",
        features: [
            {
                name: "Customer Support",
                free: "Email",
                starter: "Priority Email",
                pro: "Live Chat",
                power: "24/7 Dedicated",
            },
            {
                name: "MFA Security",
                free: true,
                starter: true,
                pro: true,
                power: true,
            },
            {
                name: "API Access",
                free: false,
                starter: "Read-only",
                pro: "Full Access",
                power: "Full Access",
            },
        ],
    },
];

export default function PricingComparator() {
    const [selectedCategory, setSelectedCategory] = useState("all");

    const renderFeatureValue = (value: string | boolean) => {
        if (typeof value === "boolean") {
            return (
                <div className="flex justify-center">
                    {value ? (
                        <div className="w-5 h-5 rounded-full border border-emerald-700 bg-emerald-700/10 flex items-center justify-center">
                            <Check className="w-3 h-3 text-emerald-700" />
                        </div>
                    ) : (
                        <div className="w-5 h-5 rounded-full border border-red-400 bg-red-500/10 flex items-center justify-center">
                            <X className="w-3 h-3 text-red-400" />
                        </div>
                    )}
                </div>
            );
        }
        return (
            <div className="text-center">
                <span className="text-sm font-medium">{value}</span>
            </div>
        );
    };

    const filteredCategories =
        selectedCategory === "all"
            ? featureCategories
            : featureCategories.filter((cat) => cat.id === selectedCategory);

    return (
        <div className="py-16 md:py-24 container mx-auto max-w-6xl px-4">
            <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">
                    Compare features across plans
                </h3>
                <p className="text-muted-foreground text-sm">
                    Detailed breakdown of what's included in each plan
                </p>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 justify-center mb-6">
                <Button
                    variant={selectedCategory === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory("all")}
                    className={
                        selectedCategory === "all"
                            ? "h-9 bg-foreground text-background hover:bg-foreground/90"
                            : "h-9 bg-transparent hover:bg-muted text-muted-foreground"
                    }
                >
                    All Features
                </Button>
                {featureCategories.map((category) => (
                    <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category.id)}
                        className={
                            selectedCategory === category.id
                                ? "h-9 bg-foreground text-background hover:bg-foreground/90"
                                : "h-9 bg-transparent hover:bg-muted text-muted-foreground"
                        }
                    >
                        {category.name}
                    </Button>
                ))}
            </div>

            {/* Shadcn Table */}
            <div className="border rounded-lg overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[300px] font-semibold">Feature</TableHead>
                            <TableHead className="text-center font-semibold">Free</TableHead>
                            <TableHead className="text-center font-semibold">Starter</TableHead>
                            <TableHead className="text-center font-semibold">Pro</TableHead>
                            <TableHead className="text-center font-semibold">Power</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCategories.map((category) => (
                            <Fragment key={category.id}>
                                {/* Category Header Row */}
                                <TableRow className="hover:bg-transparent bg-muted/50">
                                    <TableCell colSpan={5} className="font-semibold text-sm py-3">
                                        {category.name}
                                    </TableCell>
                                </TableRow>
                                {/* Feature Rows */}
                                {category.features.map((feature, index) => (
                                    <TableRow
                                        key={`${category.id}-${index}`}
                                        className="hover:bg-muted/30 transition-colors"
                                    >
                                        <TableCell className="font-medium">{feature.name}</TableCell>
                                        <TableCell className="text-center py-4">
                                            {renderFeatureValue(feature.free)}
                                        </TableCell>
                                        <TableCell className="text-center py-4">
                                            {renderFeatureValue(feature.starter)}
                                        </TableCell>
                                        <TableCell className="text-center py-4">
                                            {renderFeatureValue(feature.pro)}
                                        </TableCell>
                                        <TableCell className="text-center py-4">
                                            {renderFeatureValue(feature.power)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </Fragment>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
