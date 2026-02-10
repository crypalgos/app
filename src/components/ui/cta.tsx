"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { SparklesCore } from "@/components/ui/sparkles"

interface CtaProps {
    className?: string
    title?: string
    description?: string
    ctaText?: string
    ctaLink?: string
}

export function Cta({
    className,
    title = "Start Exploring",
    description = "Components, Motion, and UI Primitives — All in One Place",
    ctaText = "Browse Components",
    ctaLink = "/components",
}: CtaProps) {
    return (
        <div className={cn("mx-auto max-w-[1200px] px-5 lg:px-8", className)}>
            <div
                className="relative mx-auto flex w-full max-w-[1200px] flex-col items-center gap-6 rounded-[50px] px-12 py-16 text-center shadow-[0_12px_32px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.06)] overflow-hidden select-none transition-all duration-300"
                style={{
                    background: "linear-gradient(135deg, #7968FD, #6C5CE7, #5B4ADF, #4834D4, #341F97, #130F40)",
                }}
            >
                <style jsx>{`
                    @keyframes noise {
                        0% { transform: translate(0, 0); }
                        10% { transform: translate(-5%, -5%); }
                        20% { transform: translate(-10%, 5%); }
                        30% { transform: translate(5%, -10%); }
                        40% { transform: translate(-5%, 15%); }
                        50% { transform: translate(-10%, 5%); }
                        60% { transform: translate(15%, 0); }
                        70% { transform: translate(0, 10%); }
                        80% { transform: translate(-15%, 0); }
                        90% { transform: translate(10%, 5%); }
                        100% { transform: translate(5%, 0); }
                    }
                `}</style>
                <div
                    className="pointer-events-none absolute inset-[-200%] z-[1] opacity-100"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`,
                        backgroundSize: "300px 300px",
                        backgroundRepeat: "repeat",
                        filter: "brightness(4) contrast(1.2)",
                        mixBlendMode: "lighten",
                        animation: "noise 8s steps(10) infinite",
                        opacity: 1,
                    }}
                ></div>

                <div className="absolute inset-0 z-[1]">
                    <SparklesCore
                        id="tsparticlesfullpage"
                        background="transparent"
                        minSize={0.6}
                        maxSize={1.4}
                        particleDensity={100}
                        className="w-full h-full"
                        particleColor="#FFFFFF"
                    />
                </div>

                <span className="relative z-[2] block text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight dark:text-white text-white drop-shadow-sm">
                    {title}
                </span>
                <span className="relative z-[2] block max-w-[600px] text-base sm:text-lg font-medium leading-tight dark:text-white/90 text-white/90 drop-shadow-sm">
                    {description}
                </span>
                <Link
                    className="relative z-[2] text-base font-medium tracking-tight transition-all"
                    href={ctaLink || "/components"}
                >
                    <button className="group relative inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 overflow-hidden [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 rounded-full h-9 px-6 py-2 transition-colors duration-700 ease-in-out border border-white dark:border-white hover:bg-transparent">
                        <div className="absolute inset-0 transition-colors duration-700 ease-in-out [border-radius:inherit] bg-white dark:bg-white group-hover:bg-transparent"></div>
                        <div className="absolute top-1/2 -translate-y-1/2 rounded-full transition-all duration-700 ease-in-out bg-black dark:bg-black w-2.5 h-2.5 left-3 group-hover:bg-white group-hover:left-[calc(100%-1.25rem)]"></div>
                        <span className="relative z-10 font-bold transition-all duration-700 ease-in-out translate-x-1.5 text-black dark:text-black group-hover:text-white group-hover:-translate-x-1.5">
                            {ctaText}
                        </span>
                    </button>
                </Link>
            </div>
        </div>
    )
}