"use client";

import Image from "next/image";

export function FloatingAssets() {
  return (
    <>
      {/* Floating Crypto Icons (Atmospheric) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[10%] opacity-20 dark:opacity-30 filter saturate-[0.8] dark:saturate-[1.1] blur-[0.5px] animate-pulse">
          <Image
            src="/crypto-icons/bitcoin.png"
            alt="Bitcoin"
            width={80}
            height={80}
            className="rotate-12"
          />
        </div>
        <div className="absolute top-[60%] left-[5%] opacity-15 dark:opacity-25 filter saturate-[0.6] dark:saturate-[0.9] blur-[1px]">
          <Image
            src="/crypto-icons/ethereum.png"
            alt="Ethereum"
            width={100}
            height={100}
            className="-rotate-12"
          />
        </div>
        <div className="absolute top-[25%] right-[10%] opacity-10 dark:opacity-20 filter saturate-[0.5] dark:saturate-[0.8] blur-[2px]">
          <Image
            src="/crypto-icons/solana.png"
            alt="Solana"
            width={120}
            height={120}
            className="rotate-45"
          />
        </div>
        <div className="absolute bottom-[20%] right-[15%] opacity-20 dark:opacity-30 filter saturate-[0.8] dark:saturate-[1.1] blur-[0.5px] animate-pulse">
          <Image
            src="/crypto-icons/usdt.png"
            alt="USDT"
            width={70}
            height={70}
            className="-rotate-6"
          />
        </div>
      </div>

      {/* Ambient Effects - Extra depth for Dark Mode */}
      <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-primary/20 dark:bg-primary/25 blur-[150px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-1/2 h-1/2 bg-accent/20 dark:bg-accent/25 blur-[150px] animate-pulse pointer-events-none" />
    </>
  );
}
