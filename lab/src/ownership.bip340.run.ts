import { verifyBIP340OwnershipProgram } from './ownership.bip340.js';
import { Gadgets, Crypto, Cache } from 'o1js';
// @ts-ignore
import { Point, Ecdsa } from '../../node_modules/o1js/dist/node/lib/gadgets/elliptic-curve.js';
// import { Point, Ecdsa } from 'o1js'; // if available after patching

import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { schnorr, secp256k1 } from '@noble/curves/secp256k1';
import { schnorrGetE } from './schnorrGetE.js';

const Secp256k1 = Crypto.createCurve(Crypto.CurveParams.Secp256k1);

let privateKeys = [
  hexToBytes("B7E151628AED2A6ABF7158809CF4F3C762E7160F38B4DA56A784D9045190CFEF"),
  hexToBytes("C90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B14E5C9"),
  hexToBytes("0B432B2677937381AEF05BB02A66ECD012773062CF3FA2549E44F58ED2401710"),
  schnorr.utils.randomPrivateKey(),
  schnorr.utils.randomPrivateKey(),
  schnorr.utils.randomPrivateKey(),
];

let publicKeyPoints = [
  Point.from({
    x: secp256k1.ProjectivePoint.fromPrivateKey(privateKeys[0]).px,
    y: secp256k1.ProjectivePoint.fromPrivateKey(privateKeys[0]).py,
  }),
  Point.from({
    x: secp256k1.ProjectivePoint.fromPrivateKey(privateKeys[1]).px,
    y: secp256k1.ProjectivePoint.fromPrivateKey(privateKeys[1]).py,
  }),
  Point.from({
    x: secp256k1.ProjectivePoint.fromPrivateKey(privateKeys[2]).px,
    y: secp256k1.ProjectivePoint.fromPrivateKey(privateKeys[2]).py,
  }),
];

let msg = "243F6A8885A308D313198A2E03707344A4093822299F31D0082EFA98EC4E6C89";
let auxRand = "C87AA53824B4D7AE2EB035A2B5BBBCCC080E76CDC6D1692C4B0B62D798E6D906";
let signatures = [
  Ecdsa.Signature.fromHex('0x'+bytesToHex(schnorr.sign(msg, privateKeys[0], auxRand))),
  Ecdsa.Signature.fromHex('0x'+bytesToHex(schnorr.sign(msg, privateKeys[1], auxRand))),
  Ecdsa.Signature.fromHex('0x'+bytesToHex(schnorr.sign(msg, privateKeys[2], auxRand))),
];

// e = int(hashBIP0340/challenge(bytes(r) || bytes(P) || m)) mod n.
let messageHashes = [
  Gadgets.Field3.from(schnorrGetE(schnorr.sign(msg, privateKeys[0], auxRand), msg, schnorr.getPublicKey(privateKeys[0]))),
  Gadgets.Field3.from(schnorrGetE(schnorr.sign(msg, privateKeys[1], auxRand), msg, schnorr.getPublicKey(privateKeys[1]))),
  Gadgets.Field3.from(schnorrGetE(schnorr.sign(msg, privateKeys[2], auxRand), msg, schnorr.getPublicKey(privateKeys[2]))),
];

console.log('compiling ZkProgram ...');
console.time('compile ZkProgram');
const cache: Cache = Cache.FileSystem('./cache');
await verifyBIP340OwnershipProgram.compile({ cache });
console.timeEnd('compile ZkProgram');

console.log("TEST #1: verifying publicKey0 with signature0, should be true");
let proof = await verifyBIP340OwnershipProgram.verifyBIP340(
  messageHashes[0],
  signatures[0],
  publicKeyPoints[0]
);

proof.publicOutput.assertTrue();
console.log("TEST #1 result, should be true:", proof.publicOutput.toBoolean());
// assert(await verifyBIP340OwnershipProgram.verify(proof), 'proof wrong');

console.log("TEST #2: verifying publicKey1 with signature1, should be true");
proof = await verifyBIP340OwnershipProgram.verifyBIP340(
  messageHashes[1],
  signatures[1],
  publicKeyPoints[1]
);

proof.publicOutput.assertTrue();
console.log("TEST #2 result, should be true:", proof.publicOutput.toBoolean());
// assert(await verifyBIP340OwnershipProgram.verify(proof), 'proof wrong');

console.log("TEST #3: verifying publicKey0 with signature1, should be false");
proof = await verifyBIP340OwnershipProgram.verifyBIP340(
  messageHashes[0],
  signatures[1],
  publicKeyPoints[0]
);

proof.publicOutput.assertFalse();
console.log("TEST #3 result, should be false:", proof.publicOutput.toBoolean());
// assert(await verifyBIP340OwnershipProgram.verify(proof), 'proof wrong');
