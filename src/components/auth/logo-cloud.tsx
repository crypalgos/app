"use client";

import Image from "next/image";

export function LogoCloud() {
  return (
    <div className="space-y-6 overflow-hidden">
      <div className="flex items-center justify-center gap-4 opacity-40">
        <div className="h-px w-12 bg-border" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap">
          Connected Exchanges
        </span>
        <div className="h-px w-12 bg-border" />
      </div>

      <div className="relative group">
        <div className="flex overflow-hidden mask-[linear-gradient(to_right,transparent,black_15%,black_85%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
          <div className="flex items-center gap-24 py-8 animate-marquee group-hover:paused opacity-75 dark:opacity-90 contrast-125 saturate-[1.1] transition-opacity duration-500">
            {/* First Set */}
            <div className="shrink-0">
              <Image
                src="/brokers/binance.svg"
                alt="Binance"
                width={180}
                height={48}
                className="h-10 w-auto object-contain dark:brightness-110 dark:contrast-125"
              />
            </div>
            <div className="shrink-0">
              <Image
                src="/brokers/bybit.svg"
                alt="Bybit"
                width={140}
                height={48}
                className="h-10 w-auto object-contain dark:brightness-110 dark:contrast-125"
              />
            </div>
            <div className="shrink-0">
              <Image
                src="/brokers/coinbase.svg"
                alt="Coinbase"
                width={160}
                height={48}
                className="h-8 w-auto object-contain dark:brightness-110 dark:contrast-125"
              />
            </div>
            <div className="shrink-0">
              <Image
                src="/brokers/coindcx.svg"
                alt="CoinDCX"
                width={150}
                height={48}
                className="h-10 w-auto object-contain dark:brightness-110 dark:contrast-125"
              />
            </div>
            <div className="shrink-0">
              <Image
                src="/brokers/deltaexchange.svg"
                alt="Delta Exchange"
                width={200}
                height={48}
                className="h-9 w-auto object-contain dark:brightness-125"
              />
            </div>

            {/* Duplicate Set for Seamless Loop */}
            <div className="shrink-0">
              <Image
                src="/brokers/binance.svg"
                alt="Binance"
                width={180}
                height={48}
                className="h-10 w-auto object-contain dark:brightness-110 dark:contrast-125"
              />
            </div>
            <div className="shrink-0">
              <Image
                src="/brokers/bybit.svg"
                alt="Bybit"
                width={140}
                height={48}
                className="h-10 w-auto object-contain dark:brightness-110 dark:contrast-125"
              />
            </div>
            <div className="shrink-0">
              <Image
                src="/brokers/coinbase.svg"
                alt="Coinbase"
                width={160}
                height={48}
                className="h-8 w-auto object-contain dark:brightness-110 dark:contrast-125"
              />
            </div>
            <div className="shrink-0">
              <Image
                src="/brokers/coindcx.svg"
                alt="CoinDCX"
                width={150}
                height={48}
                className="h-10 w-auto object-contain dark:brightness-110 dark:contrast-125"
              />
            </div>
            <div className="shrink-0">
              <Image
                src="/brokers/deltaexchange.svg"
                alt="Delta Exchange"
                width={200}
                height={48}
                className="h-9 w-auto object-contain dark:brightness-125 dark:contrast-150"
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
      `}</style>
    </div>
  );
}
