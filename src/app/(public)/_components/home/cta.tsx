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
  title = "Start Trading Smarter",
  subtitle = "Automated Strategies, Real-Time Insights, Effortless Crypto Trading — All in One Place",
  buttonText = "Get Started",
  linkTo = "/get-started/index",
  className = "",
}) => {
  return (
    <section className={`w-full py-20 relative z-[22] ${className}`}>
      <div className="max-w-[1200px] mx-auto px-5">
        <div
          className="
            relative w-full max-w-[1200px] mx-auto
            rounded-[50px] py-22 px-12 md:px-10 md:py-22
            bg-[linear-gradient(135deg,#7c3aed,rgba(24,47,255,0.6))]
            bg-[length:200%_200%]
            shadow-[0_8px_32px_0_rgba(31,38,135,0.5)]
            overflow-hidden
            transition-all duration-300 ease-in-out
            flex flex-col items-center justify-center text-center gap-8
            select-none
            hover:shadow-[0_12px_48px_0_rgba(31,38,135,0.6)]
            group
          "
        >
          {/* Grain Texture Overlay */}
          <div
            className="
              absolute inset-0 pointer-events-none z-[1]
              opacity-100 mix-blend-lighten brightness-[3]
              bg-[url('/assets/demo/grain.webp')]
              bg-[length:500px_500px] bg-repeat
            "
          />

          {/* Content */}
          <div className="relative z-[2] flex flex-col items-center gap-6">
            <h2
              className="
              text-white text-5xl md:text-4xl sm:text-3xl
              font-medium leading-none
              animate-[fadeInUp_0.6s_ease-out]
            "
            >
              {title}
            </h2>

            <p
              className="
              text-white text-[1.2rem] sm:text-base
              font-medium opacity-60 max-w-[600px] leading-tight
              animate-[fadeInUp_0.6s_ease-out_0.1s_both]
            "
            >
              {subtitle}
            </p>

            <Link
              href={linkTo}
              className="
                inline-block mt-2
                bg-white text-[#7c3aed]
                border border-white
                px-[1.8rem] py-[0.6rem]
                text-base font-medium tracking-tight
                rounded-full
                transition-all duration-200 ease-in-out
                hover:shadow-[0_4px_12px_rgba(255,255,255,0.3)]
                hover:-translate-y-0.5
                active:translate-y-0
                animate-[fadeInUp_0.6s_ease-out_0.2s_both]
                no-underline
              "
            >
              {buttonText}
            </Link>
          </div>
        </div>
      </div>

      {/* Keyframe Animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
};

export default StartBuilding;
