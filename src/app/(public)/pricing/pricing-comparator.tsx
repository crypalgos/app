import { Button } from '@/components/ui/button'
import { Cpu, X } from 'lucide-react'
import Link from 'next/link'

const tableData = [
    {
        feature: 'Exchange Connections',
        free: '1',
        pro: '3',
        startup: 'Unlimited',
    },
    {
        feature: 'Live Trading Bots',
        free: '1',
        pro: '10',
        startup: 'Unlimited',
    },
    {
        feature: 'Backtesting Strategy',
        free: 'Daily Limit',
        pro: 'Unlimited',
        startup: 'Priority Execution',
    },
    {
        feature: 'AI Strategy Optimization',
        free: false,
        pro: true,
        startup: true,
    },
    {
        feature: 'Technical Indicators',
        free: 'Standard',
        pro: 'All + Custom',
        startup: 'All + Proprietary',
    },
    {
        feature: 'Portfolio Analytics',
        free: 'Basic',
        pro: 'Advanced',
        startup: 'Real-time',
    },
    {
        feature: 'Webhook Alerts',
        free: '5',
        pro: '50',
        startup: 'Unlimited',
    },
    {
        feature: 'Paper Trading',
        free: true,
        pro: true,
        startup: true,
    },
    {
        feature: 'Priority Support',
        free: false,
        pro: true,
        startup: true,
    },
]

export default function PricingComparator() {
    return (
        <section className="py-16 md:py-32">
            <div className="mx-auto max-w-5xl px-6">
                <div className="w-full overflow-auto lg:overflow-visible">
                    <table className="w-[200vw] border-separate border-spacing-x-3 md:w-full dark:[--color-muted:var(--color-zinc-900)]">
                        <thead className="bg-background sticky top-0">
                            <tr className="*:py-4 *:text-left *:font-medium">
                                <th className="lg:w-2/5"></th>
                                <th className="space-y-3">
                                    <span className="block">Basic</span>

                                    <Button
                                        asChild
                                        className="bg-foreground text-background hover:bg-foreground/90"
                                        size="sm">
                                        <Link href="#">Get Started</Link>
                                    </Button>
                                </th>
                                <th className="rounded-t-lg border-2 border-blue-500 border-b-0 space-y-3 px-4 dark:border-blue-400">
                                    <span className="block">Premium</span>
                                    <Button
                                        asChild
                                        className="bg-foreground text-background hover:bg-foreground/90"
                                        size="sm">
                                        <Link href="#">Get Started</Link>
                                    </Button>
                                </th>
                                <th className="space-y-3">
                                    <span className="block">Enterprise</span>
                                    <Button
                                        asChild
                                        className="bg-foreground text-background hover:bg-foreground/90"
                                        size="sm">
                                        <Link href="#">Contact Sales</Link>
                                    </Button>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="text-caption text-sm">
                            <tr className="*:py-3">
                                <td className="flex items-center gap-2 font-medium">
                                    <Cpu className="size-4" />
                                    <span>Trading Features</span>
                                </td>
                                <td></td>
                                <td className="border-l-2 border-r-2 border-l-blue-500 border-r-blue-500 dark:border-l-blue-400 dark:border-r-blue-400 px-4"></td>
                                <td></td>
                            </tr>
                            {tableData.map((row, index) => (
                                <tr
                                    key={index}
                                    className="*:border-b *:py-3">
                                    <td className="text-muted-foreground">{row.feature}</td>
                                    <td>
                                        {row.free === true ? (
                                            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-chart-2">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    fill="currentColor"
                                                    className="h-2 w-2 text-white">
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </div>
                                        ) : row.free === false ? (
                                            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted">
                                                <X className="h-3 w-3 text-red-500" />
                                            </div>
                                        ) : (
                                            row.free
                                        )}
                                    </td>
                                    <td className="border-l-2 border-r-2 border-b border-l-blue-500 border-r-blue-500 dark:border-l-blue-400 dark:border-r-blue-400 px-4">
                                        <div className="-mb-3 py-3">
                                            {row.pro === true ? (
                                                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 24 24"
                                                        fill="currentColor"
                                                        className="h-2 w-2 text-white">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </div>
                                            ) : row.pro === false ? (
                                                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted">
                                                    <X className="h-3 w-3 text-red-500" />
                                                </div>
                                            ) : (
                                                row.pro
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        {row.startup === true ? (
                                            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-chart-2">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    fill="currentColor"
                                                    className="h-2 w-2 text-white">
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </div>
                                        ) : row.startup === false ? (
                                            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted">
                                                <X className="h-3 w-3 text-red-500" />
                                            </div>
                                        ) : (
                                            row.startup
                                        )}
                                    </td>
                                </tr>
                            ))}
                            <tr className="*:py-6">
                                <td></td>
                                <td></td>
                                <td className="rounded-b-lg border-2 border-blue-500 border-t-0 px-4 dark:border-blue-400"></td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    )
}
