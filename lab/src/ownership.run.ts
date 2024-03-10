import {
  Secp256k1,
  Ecdsa,
  verifyEcdsaOwnershipProgram,
  Scalar,
} from './ownership.js';
import { Gadgets, Poseidon, Field, Keccak, Bytes } from 'o1js';
import assert from 'assert';

import * as ethjsUtil from '@ethereumjs/util';
import Web3 from 'web3';
const web3 = new Web3(/* PROVIDER */);

/*
  A public key is just an x and y coordinate, so ultimately it's just two very large 256-bit numbers:
  However, when displaying a public key we typically start by converting these numbers as two 32-byte hexadecimal values:
  
  let publicKey = Point.from({
    x: 49781623198970027997721070672560275063607048368575198229673025608762959476014n,
    y: 44999051047832679156664607491606359183507784636787036192076848057884504239143n,
  });
  */

// create an account with web3.js
let account = web3.eth.accounts.create();
console.log('account', account);

console.log('=== sign with web3.js');
const message = 'hello';
const web3SignedMessage = web3.eth.accounts.sign(message, account.privateKey);

console.log('hashMessage', web3.eth.accounts.hashMessage(message));
console.log('web3SignedMessage', web3SignedMessage);

let sig3 = web3SignedMessage;
console.log(
  'web3 recover',
  web3.eth.accounts.recover(message, sig3.v, sig3.r, sig3.s)
);

const publicKey = ethjsUtil.ecrecover(
  ethjsUtil.hexToBytes(sig3.messageHash),
  BigInt(sig3.v),
  ethjsUtil.hexToBytes(sig3.r),
  ethjsUtil.hexToBytes(sig3.s)
);

const publicKeyHex = ethjsUtil.bytesToHex(publicKey);
console.log('Recovered public key', publicKeyHex);

// const ethereumAddressFields = Keccak.ethereum(Bytes.fromHex(publicKeyHex.substring(2))).toFields().slice(12);

type Point = { x: Gadgets.Field3; y: Gadgets.Field3 };

// publicKeyPoint is derived from X and Y point of the publickey which can be recovered from signature
// its format is 0x + X + Y
console.log('X', publicKeyHex.substring(2, 66));
console.log('Y', publicKeyHex.substring(66));

let publicKeyPoint: Point = {
  x: Gadgets.Field3.from(BigInt('0x' + publicKeyHex.substring(2, 66))),
  y: Gadgets.Field3.from(BigInt('0x' + publicKeyHex.substring(66, 130))),
};

let signature = Ecdsa.fromHex(web3SignedMessage.signature);
let msgHash = Scalar.from(BigInt(web3SignedMessage.messageHash));
let publicKeyCurve = Secp256k1.from(publicKeyPoint);

// investigate the constraint system generated by ECDSA verify
console.time('ecdsa verify only (build constraint system)');
let csEcdsa = await verifyEcdsaOwnershipProgram.analyzeMethods();
console.timeEnd('ecdsa verify only (build constraint system)');
console.log(csEcdsa.verifySignedHash.summary());

// compile and prove
console.time('verifyEcdsaOwnershipProgram (compile)');
await verifyEcdsaOwnershipProgram.compile();
console.timeEnd('verifyEcdsaOwnershipProgram (compile)');

console.time('verifyEcdsaOwnershipProgram (prove)');
let proof = await verifyEcdsaOwnershipProgram.verifySignedHash(
  msgHash,
  signature,
  publicKeyCurve
);
console.timeEnd('verifyEcdsaOwnershipProgram (prove)');

proof.publicOutput.assertTrue('signature wrong');
assert(await verifyEcdsaOwnershipProgram.verify(proof), 'proof wrong');
