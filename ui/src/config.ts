import { privateKeyToAccount } from "viem/accounts";

import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { schnorr, secp256k1 } from '@noble/curves/secp256k1';

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

export const BIP340_PRIVATE_KEYS = [
  "B7E151628AED2A6ABF7158809CF4F3C762E7160F38B4DA56A784D9045190CFEF",
  "C90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B14E5C9",
  "0B432B2677937381AEF05BB02A66ECD012773062CF3FA2549E44F58ED2401710",
  "6f04344f9d64b3a5f84371aa708c1ad4b78a2e9fc28904b681cfefc504df9935",
  "3bc2ebd3e9f61e8ce7c7c5ef0a9ed903181cb416493b929928ac3f1107f7f527",
  // bytesToHex(schnorr.utils.randomPrivateKey()),
];

function generate_bip340_account(privateKeyHex: any) {
  // let privateKey = schnorr.utils.randomPrivateKey();
  // let privateKeyHex = bytesToHex(privateKey);

  let publicKey = schnorr.getPublicKey(privateKeyHex);
  let publicKeyHex = bytesToHex(publicKey);
  let publicKeyPoint = schnorr.utils.lift_x(secp256k1.ProjectivePoint.fromPrivateKey(hexToBytes(privateKeyHex)).px);

  return { privateKeyHex, publicKeyHex, publicKeyPoint, address: '0x'+ publicKeyHex };
}
export const BIP340_ACCOUNTS = [
  generate_bip340_account(BIP340_PRIVATE_KEYS[0]),
  generate_bip340_account(BIP340_PRIVATE_KEYS[1]),
  generate_bip340_account(BIP340_PRIVATE_KEYS[2]),
  generate_bip340_account(BIP340_PRIVATE_KEYS[3]),
  generate_bip340_account(BIP340_PRIVATE_KEYS[4]),
];