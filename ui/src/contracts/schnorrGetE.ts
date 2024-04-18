import { sha256 } from '@noble/hashes/sha256';
import { secp256k1 } from '@noble/curves/secp256k1';
import { Field, mod, pow2 } from '@noble/curves/abstract/modular';
import { ProjPointType as PointType } from '@noble/curves/abstract/weierstrass';
import type { Hex, PrivKey } from '@noble/curves/abstract/utils';
import {
  bytesToNumberBE,
  concatBytes,
  ensureBytes,
  numberToBytesBE,
} from '@noble/curves/abstract/utils';

export { schnorrGetE };

const secp256k1P = BigInt(
  '0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f'
);
const secp256k1N = BigInt(
  '0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141'
);
const _1n = BigInt(1);
const _2n = BigInt(2);
const divNearest = (a: bigint, b: bigint) => (a + b / _2n) / b;

/**
 * √n = n^((p+1)/4) for fields p = 3 mod 4. We unwrap the loop and multiply bit-by-bit.
 * (P+1n/4n).toString(2) would produce bits [223x 1, 0, 22x 1, 4x 0, 11, 00]
 */
function sqrtMod(y: bigint): bigint {
  const P = secp256k1P;
  // prettier-ignore
  const _3n = BigInt(3), _6n = BigInt(6), _11n = BigInt(11), _22n = BigInt(22);
  // prettier-ignore
  const _23n = BigInt(23), _44n = BigInt(44), _88n = BigInt(88);
  const b2 = (y * y * y) % P; // x^3, 11
  const b3 = (b2 * b2 * y) % P; // x^7
  const b6 = (pow2(b3, _3n, P) * b3) % P;
  const b9 = (pow2(b6, _3n, P) * b3) % P;
  const b11 = (pow2(b9, _2n, P) * b2) % P;
  const b22 = (pow2(b11, _11n, P) * b11) % P;
  const b44 = (pow2(b22, _22n, P) * b22) % P;
  const b88 = (pow2(b44, _44n, P) * b44) % P;
  const b176 = (pow2(b88, _88n, P) * b88) % P;
  const b220 = (pow2(b176, _44n, P) * b44) % P;
  const b223 = (pow2(b220, _3n, P) * b3) % P;
  const t1 = (pow2(b223, _23n, P) * b22) % P;
  const t2 = (pow2(t1, _6n, P) * b2) % P;
  const root = pow2(t2, _2n, P);
  if (!Fp.eql(Fp.sqr(root), y)) throw new Error('Cannot find square root');
  return root;
}

const Fp = Field(secp256k1P, undefined, undefined, { sqrt: sqrtMod });

// Schnorr signatures are superior to ECDSA from above. Below is Schnorr-specific BIP0340 code.
// https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki
const _0n = BigInt(0);
const fe = (x: bigint) => typeof x === 'bigint' && _0n < x && x < secp256k1P;
const ge = (x: bigint) => typeof x === 'bigint' && _0n < x && x < secp256k1N;
/** An object mapping tags to their tagged hash prefix of [SHA256(tag) | SHA256(tag)] */
const TAGGED_HASH_PREFIXES: { [tag: string]: Uint8Array } = {};
function taggedHash(tag: string, ...messages: Uint8Array[]): Uint8Array {
  let tagP = TAGGED_HASH_PREFIXES[tag];
  if (tagP === undefined) {
    const tagH = sha256(Uint8Array.from(tag, (c) => c.charCodeAt(0)));
    tagP = concatBytes(tagH, tagH);
    TAGGED_HASH_PREFIXES[tag] = tagP;
  }
  return sha256(concatBytes(tagP, ...messages));
}

// ECDSA compact points are 33-byte. Schnorr is 32: we strip first byte 0x02 or 0x03
const pointToBytes = (point: PointType<bigint>) =>
  point.toRawBytes(true).slice(1);
const numTo32b = (n: bigint) => numberToBytesBE(n, 32);
const modP = (x: bigint) => mod(x, secp256k1P);
const modN = (x: bigint) => mod(x, secp256k1N);
const Point = secp256k1.ProjectivePoint;

/**
 * lift_x from BIP340. Convert 32-byte x coordinate to elliptic curve point.
 * @returns valid point checked for being on-curve
 */
function lift_x(x: bigint): PointType<bigint> {
  if (!fe(x)) throw new Error('bad x: need 0 < x < p'); // Fail if x ≥ p.
  const xx = modP(x * x);
  const c = modP(xx * x + BigInt(7)); // Let c = x³ + 7 mod p.
  let y = sqrtMod(c); // Let y = c^(p+1)/4 mod p.
  if (y % _2n !== _0n) y = modP(-y); // Return the unique point P such that x(P) = x and
  const p = new Point(x, y, _1n); // y(P) = y if y mod 2 = 0 or y(P) = p-y otherwise.
  p.assertValidity();
  return p;
}
/**
 * Create tagged hash, convert it to bigint, reduce modulo-n.
 */
function challenge(...args: Uint8Array[]): bigint {
  return modN(bytesToNumberBE(taggedHash('BIP0340/challenge', ...args)));
}

function schnorrGetE(
  signature: Hex,
  message: Hex,
  publicKey: Hex
): bigint {
  const sig = ensureBytes('signature', signature, 64);
  const m = ensureBytes('message', message);
  const pub = ensureBytes('publicKey', publicKey, 32);
  try {
    const P = lift_x(bytesToNumberBE(pub)); // P = lift_x(int(pk)); fail if that fails
    const r = bytesToNumberBE(sig.subarray(0, 32)); // Let r = int(sig[0:32]); fail if r ≥ p.
    if (!fe(r)) return 0n;
    const s = bytesToNumberBE(sig.subarray(32, 64)); // Let s = int(sig[32:64]); fail if s ≥ n.
    if (!ge(s)) return 0n;

    const e = challenge(numTo32b(r), pointToBytes(P), m); // int(challenge(bytes(r)||bytes(P)||m))%n
    return e;
  } catch (error) {
    return 0n;
  }
}
