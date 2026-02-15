// "use client";

// import { cn } from "@/lib/utils";
// import { IconShieldCheck, IconBolt, IconChartLine } from "@tabler/icons-react";
// import Image from "next/image";

// const supportedCoins = [
//   { name: "Bitcoin", symbol: "BTC", icon: "/crypto-icons/bitcoin.png" },
//   { name: "Ethereum", symbol: "ETH", icon: "/crypto-icons/ethereum.png" },
//   { name: "Solana", symbol: "SOL", icon: "/crypto-icons/solana.png" },
//   { name: "BNB", symbol: "BNB", icon: "/crypto-icons/bnb.png" },
//   { name: "Cardano", symbol: "ADA", icon: "/crypto-icons/cardano.png" },
//   { name: "XRP", symbol: "XRP", icon: "/crypto-icons/xrp.png" },
//   { name: "USDT", symbol: "USDT", icon: "/crypto-icons/usdt.png" },
//   { name: "USDC", symbol: "USDC", icon: "/crypto-icons/usdc.png" },
// ];

// const exchanges = ["Binance", "Coinbase", "Bybit", "OKX", "Kraken", "Bitfinex"];

// const features = [
//   {
//     icon: IconChartLine,
//     title: "Algorithmic Trading",
//     description: "Build & deploy automated strategies",
//   },
//   {
//     icon: IconBolt,
//     title: "Multi-Exchange",
//     description: "Trade across major platforms",
//   },
//   {
//     icon: IconShieldCheck,
//     title: "Secure & Encrypted",
//     description: "Bank-grade security protocols",
//   },
// ];

// export function AuthVisuals() {
//   return (
//     <div className="relative flex h-full w-full flex-col items-center justify-center p-8 lg:p-10 z-10">
//       {/* Subtle accent glows */}
//       <div className="absolute top-1/4 left-1/4 size-96 rounded-full bg-blue-500/5 blur-[120px]" />
//       <div className="absolute bottom-1/4 right-1/4 size-96 rounded-full bg-cyan-500/5 blur-[120px]" />

//       {/* Content */}
//       <div className="relative w-full max-w-4xl space-y-8">
//         {/* Header */}
//         <div className="space-y-4 text-center">
//           <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
//             <div className="size-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
//             <span className="text-sm text-white/80 font-medium">
//               Professional Trading Platform
//             </span>
//           </div>

//           <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
//             Deploy Crypto
//             <br />
//             <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
//               Trading Algorithms
//             </span>
//           </h2>

//           <p className="text-base text-white/50 max-w-md mx-auto leading-relaxed">
//             Automate your trading across multiple exchanges with
//             institutional-grade tools.
//           </p>
//         </div>

//         {/* Supported Assets */}
//         <div className="space-y-4">
//           <h3 className="text-sm font-semibold text-white/60 text-center">
//             Supported Assets
//           </h3>
//           <div className="grid grid-cols-4 gap-3">
//             {supportedCoins.map((coin) => (
//               <div
//                 key={coin.symbol}
//                 className="group flex flex-col items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-3 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
//               >
//                 <div className="relative size-10 rounded-full bg-white/5 p-1.5">
//                   <Image
//                     src={coin.icon}
//                     alt={coin.name}
//                     width={40}
//                     height={40}
//                     className="size-full object-contain"
//                   />
//                 </div>
//                 <span className="text-xs font-semibold text-white/80">
//                   {coin.symbol}
//                 </span>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Supported Exchanges */}
//         <div className="space-y-3">
//           <h3 className="text-sm font-semibold text-white/60 text-center">
//             Integrated Exchanges
//           </h3>
//           <div className="flex justify-center">
//             <div className="relative w-full max-w-5xl mt-9">
//               <Image
//                 src="/crypto-icons/integrated-exchanges.png"
//                 alt="Integrated Exchanges"
//                 width={800}
//                 height={240}
//                 className="w-full h-auto"
//                 priority
//               />
//             </div>
//           </div>
//         </div>

//         {/* Features */}
//         <div className="grid grid-cols-3 gap-4 pt-8">
//           {features.map((feature) => (
//             <div
//               key={feature.title}
//               className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 text-center transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10"
//             >
//               <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

//               <div className="relative z-10 flex flex-col items-center gap-3">
//                 <div className="rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-3 group-hover:scale-110 transition-transform duration-300">
//                   <feature.icon className="size-6 text-blue-400 group-hover:text-cyan-300 transition-colors" />
//                 </div>

//                 <div className="space-y-1">
//                   <h4 className="text-sm font-bold text-white/90 group-hover:text-white transition-colors">
//                     {feature.title}
//                   </h4>
//                   <p className="text-xs text-white/50 leading-relaxed group-hover:text-white/70 transition-colors">
//                     {feature.description}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }
