import {
  verifyOwnershipInclusionProgram,
  Secp256k1,
  Ecdsa,
  Scalar,
  Bytes64,
} from './ownership-inclusion.js';
import { Gadgets, Poseidon, Keccak, Field, Bytes } from 'o1js';
import assert from 'assert';
import fs from 'fs';

import { MerkleTree } from './lib/merkle/merkle_tree.js';
import { Level } from 'level';
import { LevelStore } from './lib/store/level_store.js';

import { hashMessage, recoverPublicKey } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';

// create accounts with viem
let accounts = [
  privateKeyToAccount(generatePrivateKey()),
  privateKeyToAccount(generatePrivateKey()),
  privateKeyToAccount(generatePrivateKey()),
  privateKeyToAccount(generatePrivateKey()),
  privateKeyToAccount(generatePrivateKey()),
];

console.log('=== sign with viem');
const message = 'hello';
console.log('messageHash', message, hashMessage(message));

const signature0 = await accounts[0].signMessage({ message });
console.log('signature0', signature0);

const publicKeyHex = await recoverPublicKey({
  hash: hashMessage(message),
  signature: signature0,
});

console.log('recovered public key', publicKeyHex);

// const ethereumAddressFields = Keccak.ethereum(Bytes.fromHex(publicKeyHex.substring(4))).toFields().slice(12);

type Point = { x: Gadgets.Field3; y: Gadgets.Field3 };

// publicKeyPoint is derived from X and Y point of the publickey which can be recovered from signature
// its format is 0x + X + Y
console.log('publicKey X, Y', publicKeyHex.substring(4, 68), publicKeyHex.substring(68));

let publicKeyPoint: Point = {
  x: Gadgets.Field3.from(BigInt('0x' + publicKeyHex.substring(4, 68))),
  y: Gadgets.Field3.from(BigInt('0x' + publicKeyHex.substring(68))),
};

// publicKey: 0x + X + Y
let bytesOfXY = Bytes64.fromHex(publicKeyHex.substring(4));

let signature = Ecdsa.fromHex(signature0);
let msgHash = Scalar.from(BigInt(hashMessage(message)));
let publicKeyCurve = Secp256k1.from(publicKeyPoint);

console.log('=== merkletree and leveldb');

// [remove for actual use]
// clean the './db' folder as dynamic keypair is used for each run
fs.rmSync('./db', { recursive: true, force: true });

// off-chain persistence with levelDB
const levelDb = new Level<string, any>('./db');

let store: LevelStore<Field> = new LevelStore<Field>(
  levelDb,
  Field,
  'inclusionSet'
);

// hash can be derived from publicKey point
// and hash can also be derived from eth addresses without 0x prefix
let accountHashes = [
  Poseidon.hash(Keccak.ethereum(bytesOfXY).toFields().slice(12)),
  Poseidon.hash(Bytes.fromHex(accounts[1].address.substring(2)).toFields()),
  Poseidon.hash(Bytes.fromHex(accounts[2].address.substring(2)).toFields()),
  Poseidon.hash(Bytes.fromHex(accounts[3].address.substring(2)).toFields()),
  Poseidon.hash(Bytes.fromHex(accounts[4].address.substring(2)).toFields()),
];

// build or load MerkleTree
let tree: MerkleTree<Field>;

try {
  // load from level store
  console.log('loading from off-chain storage levelDB ...');
  tree = await MerkleTree.import<Field>(store, 8, Field);
  console.log(tree.getRoot().toString());
} catch (e) {
  console.log('leveldb is not there, building tree ...');
  tree = await MerkleTree.build<Field>(store, 8, Field);

  await tree.update(0n, accountHashes[0]);
  await tree.update(1n, accountHashes[1]);
  await tree.update(2n, accountHashes[2]);
  await tree.update(3n, accountHashes[3]);
}

console.log('tree.getRoot', tree.getRoot().toString());

// now that we got our accounts set up, we need the commitment to deploy our contract!
const merkleRoot = tree.getRoot();

let merkleProof = await tree.prove(0n);
console.log('merkleProof.root', merkleProof.root.value);

let merkleIndex = Field(0n);

// investigate the constraint system generated by ECDSA verify

console.time('verify ownership + inclusion (build constraint system)');
let program = await verifyOwnershipInclusionProgram.analyzeMethods();
console.timeEnd('verify ownership + inclusion (build constraint system)');
console.log(program.verifyOwnershipInclusion.summary());

// compile and prove

console.time('verify ownership + inclusion (compile)');
await verifyOwnershipInclusionProgram.compile();
console.timeEnd('verify ownership + inclusion (compile)');

console.time('verify ownership + inclusion (prove)');
let proof = await verifyOwnershipInclusionProgram.verifyOwnershipInclusion(
  msgHash,
  signature,
  publicKeyCurve,
  merkleRoot,
  merkleProof,
  merkleIndex,
  bytesOfXY
);
console.timeEnd('verify ownership + inclusion (prove)');

proof.publicOutput.assertTrue('signature wrong');
assert(await verifyOwnershipInclusionProgram.verify(proof), 'proof wrong');
