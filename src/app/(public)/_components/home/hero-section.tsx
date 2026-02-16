import Link from "next/link";
import Image from "next/image";

export default function HeroSection() {
  return (
    <div className="flex flex-col min-h-[85vh] pt-16 md:pt-32 pb-12 relative overflow-hidden bg-background dark:bg-background">
      {/* Ultra-Smooth Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Soft Ambient Wash - Top Center focusing Axis */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1240px] h-full bg-[radial-gradient(circle_at_center,var(--color-primary)_0%,transparent_70%)] opacity-[0.03] dark:opacity-[0.08] blur-[160px] translate-y-[-20%]" />

        {/* Subtle Side Aurora - Very soft */}
        <div className="absolute top-[10%] right-[-5%] w-[50%] h-[50%] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.5)_0%,transparent_100%)] opacity-[0.05] blur-[160px]" />

        {/* Technical Dot Grid - Ultra subtle */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(0,0,0,0.1)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[1.5rem_1.5rem] mask-[linear-gradient(to_bottom,white,transparent_70%)]" />

        {/* Ambient Bottom Wash */}
        <div className="absolute bottom-0 left-0 w-full h-[30%] bg-linear-to-t from-background via-background/40 to-transparent z-10" />
      </div>

      <div className="relative z-10 container mx-auto px-4">
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          {/* Badge */}
          <div
            className="flex justify-center"
            style={{ opacity: 1, transform: "none" }}
          >
            <button className="bg-neutral-50/50 dark:bg-neutral-800/50 backdrop-blur-sm no-underline group cursor-pointer relative rounded-full p-px text-[10px] sm:text-xs font-semibold leading-6 text-neutral-700 dark:text-neutral-300 inline-block w-fit mx-auto border border-neutral-200/50 dark:border-neutral-700/50 shadow-sm">
              <div className="relative flex space-x-2 items-center z-10 rounded-full bg-neutral-100/50 dark:bg-background/50 py-1.5 px-4">
                <span className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Trusted by 5,000+ Algo Traders
                </span>
                <svg
                  fill="none"
                  height="16"
                  viewBox="0 0 24 24"
                  width="16"
                  xmlns="http://www.w3.org/2000/svg"
                  className="group-hover:translate-x-0.5 transition-transform duration-200"
                >
                  <path
                    d="M10.75 8.75L14.25 12L10.75 15.25"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  ></path>
                </svg>
              </div>
            </button>
          </div>

          {/* Headline */}
          <h1
            className="text-4xl md:text-6xl lg:text-8xl font-bold tracking-tight max-w-6xl mx-auto leading-[1.1] text-neutral-900 dark:text-white"
            style={{ opacity: 1, transform: "none" }}
          >
            <span className="bg-clip-text text-transparent bg-linear-to-b from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400">
              AI-Powered Crypto Trading,
            </span>
            <br />
            <span className="text-primary italic">Built for Everyone</span>
          </h1>

          {/* Subheadline */}
          <p
            className="max-w-3xl mx-auto text-lg md:text-xl text-neutral-500 dark:text-neutral-400 leading-relaxed"
            style={{ opacity: 1, transform: "none" }}
          >
            Create strategies visually or with code, backtest instantly, and
            deploy live with confidence. The future of algorithmic trading is
            here.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row items-center gap-4 justify-center"
            style={{ opacity: 1, transform: "none" }}
          >
            <button className="h-12 px-8 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all shadow-[0_0_20px_rgba(var(--color-primary),0.3)] hover:scale-[1.02] active:scale-[0.98]">
              Start Building Strategies
            </button>
            <Link
              href="#features"
              className="h-12 px-8 rounded-full border border-neutral-200 dark:border-neutral-800 font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all flex items-center gap-2 group"
            >
              <span>See How It Works</span>
              <svg
                stroke="currentColor"
                fill="currentColor"
                strokeWidth="0"
                viewBox="0 0 24 24"
                className="text-neutral-500 group-hover:translate-x-1 stroke-[1px] h-4 w-4 transition-transform duration-200 dark:text-neutral-400"
                height="1em"
                width="1em"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M12.97 3.97a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 1 1-1.06-1.06l6.22-6.22H3a.75.75 0 0 1 0-1.5h16.19l-6.22-6.22a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </Link>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-12 w-full max-w-7xl mx-auto relative group">
            <div className="absolute -inset-1 bg-linear-to-r from-primary/20 to-blue-600/20 rounded-[34px] blur-3xl opacity-5 group-hover:opacity-10 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative p-2 border border-black/[0.03] dark:border-white/[0.05] bg-white/[0.1] dark:bg-black/[0.1] backdrop-blur-3xl rounded-[32px] overflow-hidden shadow-2xl">
              <div className="p-1 bg-white dark:bg-background rounded-[24px] overflow-hidden">
                <Image
                  className="rounded-[20px] shadow-lg"
                  src="https://placehold.co/1920x1080/png?text=Crypto+Dashboard"
                  alt="Crypto Dashboard Header"
                  width={1920}
                  height={1080}
                  priority
                  unoptimized
                />
              </div>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 p-8 pointer-events-none">
                <div className="h-24 w-24 bg-primary/20 rounded-full blur-3xl" />
              </div>
              <div className="absolute bottom-0 left-0 p-8 pointer-events-none">
                <div className="h-32 w-32 bg-blue-600/10 rounded-full blur-3xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
