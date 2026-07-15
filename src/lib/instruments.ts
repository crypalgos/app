export const COIN_ID_MAP: Record<string, string> = {
  btc: "bitcoin",
  eth: "ethereum",
  sol: "solana",
  xrp: "ripple",
  bnb: "binancecoin",
  link: "chainlink",
  matic: "polygon", // Or matic-network
  avax: "avalanche-2",
  arb: "arbitrum",
  op: "optimism",
  doge: "dogecoin",
  ada: "cardano"
};

export const COIN_NAMES: Record<string, string> = {
  btc: "Bitcoin",
  eth: "Ethereum",
  sol: "Solana",
  xrp: "XRP",
  bnb: "BNB",
  link: "Chainlink",
  matic: "Polygon",
  avax: "Avalanche",
  arb: "Arbitrum",
  op: "Optimism",
  doge: "Dogecoin",
  ada: "Cardano"
};

export function getCoinLogoUrl(coinSymbol: string) {
  const normalized = coinSymbol.toLowerCase();
  const geckoId = COIN_ID_MAP[normalized];
  if (!geckoId) {
    // Fallback if not mapped
    return `https://ui-avatars.com/api/?name=${coinSymbol}&background=random`;
  }
  // We can't guarantee coingecko CDN paths as they have a unique numeric hash in the URL like /coins/images/1/thumb/bitcoin.png
  // A more reliable URL for generic crypto logos is coincap or cryptocompare, or just rely on a generic avatar if we don't have local assets.
  // Actually, standard cryptoicons API is great:
  return `https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/${normalized}.svg`;
}
