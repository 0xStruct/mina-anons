import { privateKeyToAccount } from "viem/accounts";

// these a throw-away privateKeys, generated randomly
export const PRIVATE_KEYS: `0x${string}`[] = [
  "0x23a6856c2506f416cd3d8c2383cd13550b497490265bafabec57917575637846",
  "0x42aa063351f5aedcc3a1fe9c5167e41ec6e33c3826a53ea62567c8bae3089836",
  "0x5785b8988f3b496a9844da71197dc9a641e865edcb5d975908102dc67058d8bd",
  "0xd76db099c34f31a1a363c671dbecea425e42326361e25ea5bb31beb84400cec3",
  "0x9342f63dc524e79ac5624aae5992ec515c8083b1d3e923521254d52203166b72",
];

// create accounts with viem
export const ACCOUNTS = [
  privateKeyToAccount(PRIVATE_KEYS[0]),
  privateKeyToAccount(PRIVATE_KEYS[1]),
  privateKeyToAccount(PRIVATE_KEYS[2]),
  privateKeyToAccount(PRIVATE_KEYS[3]),
  privateKeyToAccount(PRIVATE_KEYS[4]),
];
