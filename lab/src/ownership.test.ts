import {
  verifyEcdsaOwnershipProgram,
  Secp256k1,
  Ecdsa,
  Scalar,
} from './ownership.js';
import { Cache, Gadgets, Poseidon, Field, Bytes, Bool } from 'o1js';
import assert from 'assert';

import { hashMessage, recoverPublicKey } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';

describe('verifyOwnership', () => {
  // create accounts with viem
  let accounts = [
    privateKeyToAccount(generatePrivateKey()),
    privateKeyToAccount(generatePrivateKey()),
    privateKeyToAccount(generatePrivateKey()),
    privateKeyToAccount(generatePrivateKey()),
    privateKeyToAccount(generatePrivateKey()),
  ];

  const message = 'hello';
  console.log('messageHash', message, hashMessage(message));

  let accountHashes = [
    Poseidon.hash(Bytes.fromHex(accounts[0].address.substring(2)).toFields()),
    Poseidon.hash(Bytes.fromHex(accounts[1].address.substring(2)).toFields()),
    Poseidon.hash(Bytes.fromHex(accounts[2].address.substring(2)).toFields()),
    Poseidon.hash(Bytes.fromHex(accounts[3].address.substring(2)).toFields()),
    Poseidon.hash(Bytes.fromHex(accounts[4].address.substring(2)).toFields()),
  ];

  beforeAll(async () => {
    console.log('compiling ZkProgram ...');
    console.time('compile ZkProgram');
    const cache: Cache = Cache.FileSystem('./cache');
    await verifyEcdsaOwnershipProgram.compile({ cache });
    console.timeEnd('compile ZkProgram');
  });

  it('verify accounts[0] ownership with accounts[0] signature', async () => {
    console.log('=== sign with viem');
    const signature0 = await accounts[0].signMessage({ message });
    console.log('signature0', signature0);

    const publicKeyHex = await recoverPublicKey({
      hash: hashMessage(message),
      signature: signature0,
    });

    console.log('recovered public key', publicKeyHex);

    type Point = { x: Gadgets.Field3; y: Gadgets.Field3 };

    // publicKeyPoint is derived from X and Y point of the publickey which can be recovered from signature
    // its format is 0x + X + Y
    console.log(
      'publicKey X, Y',
      publicKeyHex.substring(4, 68),
      publicKeyHex.substring(68)
    );

    let publicKeyPoint: Point = {
      x: Gadgets.Field3.from(BigInt('0x' + publicKeyHex.substring(4, 68))),
      y: Gadgets.Field3.from(BigInt('0x' + publicKeyHex.substring(68))),
    };

    let signature = Ecdsa.fromHex(signature0);
    let msgHash = Scalar.from(BigInt(hashMessage(message)));
    let publicKeyCurve = Secp256k1.from(publicKeyPoint);

    let proof = await verifyEcdsaOwnershipProgram.verifySignedHash(
      msgHash,
      signature,
      publicKeyCurve
    );

    //proof.publicOutput.assertTrue('signature wrong');
    expect(proof.publicOutput).toEqual(Bool(true));
    assert(await verifyEcdsaOwnershipProgram.verify(proof), 'proof wrong');
  });

  it('verify accounts[0] ownership with accounts[1] signature, should return false', async () => {
    console.log('=== sign with viem');
    const signature0 = await accounts[0].signMessage({ message });
    const signature1 = await accounts[1].signMessage({ message });
    console.log('signature0', signature0);
    console.log('signature1', signature1);

    // this is from accounts[0]
    const publicKeyHex = await recoverPublicKey({
      hash: hashMessage(message),
      signature: signature0,
    });

    console.log('recovered public key', publicKeyHex);

    type Point = { x: Gadgets.Field3; y: Gadgets.Field3 };

    // publicKeyPoint is derived from X and Y point of the publickey which can be recovered from signature
    // its format is 0x + X + Y
    console.log(
      'publicKey X, Y',
      publicKeyHex.substring(4, 68),
      publicKeyHex.substring(68)
    );

    let publicKeyPoint: Point = {
      x: Gadgets.Field3.from(BigInt('0x' + publicKeyHex.substring(4, 68))),
      y: Gadgets.Field3.from(BigInt('0x' + publicKeyHex.substring(68))),
    };

    let signature = Ecdsa.fromHex(signature1); // signature of accounts[1]
    let msgHash = Scalar.from(BigInt(hashMessage(message)));
    let publicKeyCurve = Secp256k1.from(publicKeyPoint); // publicKeyCurve of accounts[0]

    let proof = await verifyEcdsaOwnershipProgram.verifySignedHash(
      msgHash,
      signature,
      publicKeyCurve
    );
    
    expect(proof.publicOutput).toEqual(Bool(false));
  });
});
