import { verifyBIP340OwnershipMembershipProgram, MerkleProof } from './ownership-membership.bip340.js';
import { Gadgets, Crypto, Cache, Field, Poseidon, Bytes } from 'o1js';
// @ts-ignore
import { Point, Ecdsa } from '../../node_modules/o1js/dist/node/lib/gadgets/elliptic-curve.js';
// import { Point, Ecdsa } from 'o1js'; // if available after patching

import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { schnorr, secp256k1 } from '@noble/curves/secp256k1';
import { schnorrGetE } from './schnorrGetE.js';

import fs from 'fs';

import { MerkleTree } from './lib/merkle/merkle_tree.js';
import { Level } from 'level';
import { LevelStore } from './lib/store/level_store.js';

// [remove for actual use]
// clean the './db' folder as dynamic keypairs are used for each run
fs.rmSync('./db', { recursive: true, force: true });

const Secp256k1 = Crypto.createCurve(Crypto.CurveParams.Secp256k1);

let privateKeys = [
  schnorr.utils.randomPrivateKey(),
  schnorr.utils.randomPrivateKey(),
  schnorr.utils.randomPrivateKey(),
];

// publicKeyPoints are lift_x
let publicKeyPoints = [
  Point.from({
    x: secp256k1.ProjectivePoint.fromPrivateKey(privateKeys[0]).px,
    y: schnorr.utils.lift_x(secp256k1.ProjectivePoint.fromPrivateKey(privateKeys[0]).px).py,
  }),
  Point.from({
    x: secp256k1.ProjectivePoint.fromPrivateKey(privateKeys[1]).px,
    y: schnorr.utils.lift_x(secp256k1.ProjectivePoint.fromPrivateKey(privateKeys[1]).px).py,
  }),
  Point.from({
    x: secp256k1.ProjectivePoint.fromPrivateKey(privateKeys[2]).px,
    y: schnorr.utils.lift_x(secp256k1.ProjectivePoint.fromPrivateKey(privateKeys[2]).px).py,
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

let tree: MerkleTree<Field>;
let merkleRoot: Field, merkleProof: MerkleProof, merkleIndex: Field, leafHash: Field, proof: any;

let accountHashes = [
  Poseidon.hash(publicKeyPoints[0].x), // 0n
  Poseidon.hash(publicKeyPoints[1].x),
  Poseidon.hash(publicKeyPoints[2].x),
];

// off-chain persistence with levelDB
const levelDb = new Level<string, any>('./db');

let store: LevelStore<Field> = new LevelStore<Field>(
  levelDb,
  Field,
  'membershipSet'
);

// build or load MerkleTree
try {
  // load from level store
  console.log('leveldb - loading from off-chain storage ...');
  tree = await MerkleTree.import<Field>(store, 8, Field);
} catch (e) {
  console.log('leveldb - not there, building tree ...');
  tree = await MerkleTree.build<Field>(store, 8, Field);

  await tree.update(0n, accountHashes[0]);
  await tree.update(1n, accountHashes[1]);
  await tree.update(2n, accountHashes[2]);
}

console.log('tree.getRoot', tree.getRoot().toString());

console.log('compiling ZkProgram ...');
console.time('compile ZkProgram');
const cache: Cache = Cache.FileSystem('./cache');
await verifyBIP340OwnershipMembershipProgram.compile({ cache });
console.timeEnd('compile ZkProgram');

console.log("TEST #1: verifying publicKey0 with right membership ...");

merkleRoot = tree.getRoot();
merkleProof = await tree.prove(0n);
merkleIndex = Field(0n);

proof = await verifyBIP340OwnershipMembershipProgram.verifyBIP340OwnershipMembership(
  merkleRoot,
  messageHashes[0],
  signatures[0],
  publicKeyPoints[0],
  merkleProof,
  merkleIndex
);

proof.publicOutput.verifiedOwnership.assertTrue();
proof.publicOutput.verifiedMembership.assertTrue();
console.log("TEST #1 result should be true true:", proof.publicOutput.verifiedOwnership.toBoolean(), proof.publicOutput.verifiedMembership.toBoolean());

console.log("TEST #2: verifying publicKey0 with wrong membership ...");

merkleRoot = tree.getRoot();
merkleProof = await tree.prove(1n);
merkleIndex = Field(1n);

proof = await verifyBIP340OwnershipMembershipProgram.verifyBIP340OwnershipMembership(
  merkleRoot,
  messageHashes[0],
  signatures[0],
  publicKeyPoints[0],
  merkleProof,
  merkleIndex
);

proof.publicOutput.verifiedOwnership.assertTrue();
proof.publicOutput.verifiedMembership.assertFalse();
console.log("TEST #2 result should be true false:", proof.publicOutput.verifiedOwnership.toBoolean(), proof.publicOutput.verifiedMembership.toBoolean());

console.log("TEST #3: verifying publicKey1 with right membership ...");

merkleRoot = tree.getRoot();
merkleProof = await tree.prove(1n);
merkleIndex = Field(1n);

proof = await verifyBIP340OwnershipMembershipProgram.verifyBIP340OwnershipMembership(
  merkleRoot,
  messageHashes[1],
  signatures[1],
  publicKeyPoints[1],
  merkleProof,
  merkleIndex
);

proof.publicOutput.verifiedOwnership.assertTrue();
proof.publicOutput.verifiedMembership.assertTrue();
console.log("TEST #3 result should be true true:", proof.publicOutput.verifiedOwnership.toBoolean(), proof.publicOutput.verifiedMembership.toBoolean());


console.log("TEST #4: verifying publicKey1 with wrong signature BUT with right membership ...");

merkleRoot = tree.getRoot();
merkleProof = await tree.prove(1n);
merkleIndex = Field(1n);

proof = await verifyBIP340OwnershipMembershipProgram.verifyBIP340OwnershipMembership(
  merkleRoot,
  messageHashes[1],
  signatures[2],
  publicKeyPoints[1],
  merkleProof,
  merkleIndex
);

proof.publicOutput.verifiedOwnership.assertFalse();
proof.publicOutput.verifiedMembership.assertTrue();
console.log("TEST #4 result should be false true:", proof.publicOutput.verifiedOwnership.toBoolean(), proof.publicOutput.verifiedMembership.toBoolean());
