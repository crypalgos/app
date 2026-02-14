import React from "react";
import Link from "next/link";

interface StartBuildingProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  linkTo?: string;
  className?: string;
}

const StartBuilding: React.FC<StartBuildingProps> = ({
  title = "Start Trading Smarter Today",
  subtitle = "Join thousands of traders automating their strategies with AI-powered tools.",
  buttonText = "Get Started Free",
  linkTo = "/get-started/index",
  className = "",
}) => {
  return (
    <section className={`w-full py-8 sm:py-12 md:py-16 relative z-[22] ${className}`}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-5">
        <div
          className="
            relative w-full
            rounded-2xl sm:rounded-3xl py-8 px-6 sm:py-12 sm:px-8 md:py-20 md:px-12
            bg-linear-to-br from-primary/95 to-primary
            border border-white/10
            shadow-[0_8px_32px_rgba(31,38,135,0.37)]
            backdrop-blur-sm
            overflow-hidden
            flex flex-col items-center justify-center text-center gap-4 sm:gap-6
            transition-all duration-300 ease-out
            hover:shadow-[0_12px_40px_rgba(31,38,135,0.45)]
            hover:border-white/20
          "
        >
          {/* Grain Texture Overlay */}
          <div
            className="
              absolute inset-0 pointer-events-none z-[1]
              opacity-40 mix-blend-overlay
              bg-[url('/assets/demo/grain.webp')]
              bg-size-[300px_300px] bg-repeat
            "
          />

          {/* Content */}
          <div className="relative z-[2] flex flex-col items-center gap-3 sm:gap-4 md:gap-6">
            <h2
              className="
              text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl
              font-medium leading-tight sm:leading-none
              animate-[fadeInUp_0.6s_ease-out]
              "
            >
              {title}
            </h2>

            <p
              className="
              text-white text-sm sm:text-base md:text-[1.2rem]
              font-medium opacity-60 max-w-[600px] leading-relaxed sm:leading-tight
              animate-[fadeInUp_0.6s_ease-out_0.1s_both]
              "
            >
              {subtitle}
            </p>

            <Link
              href={linkTo}
              className="
                inline-flex items-center justify-center
                mt-1 sm:mt-2
                bg-white text-primary
                px-6 py-2 sm:px-8 sm:py-2.5
                text-base sm:text-lg font-semibold
                rounded-full
                transition-all duration-200 ease-in-out
                hover:shadow-[0_4px_12px_rgba(255,255,255,0.3)]
                hover:-translate-y-0.5
                active:translate-y-0
                no-underline
              "
            >
              {buttonText}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StartBuilding;
