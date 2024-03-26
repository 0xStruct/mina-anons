import {
  verifyOwnershipMembershipProgram,
  Secp256k1,
  Ecdsa,
  Scalar,
  MerkleProof,
  Bytes64,
} from './ownership-membership.old.js';
import { Cache, Gadgets, Poseidon, Field, Bytes, Bool } from 'o1js';
import assert from 'assert';
import fs from 'fs';

import { MerkleTree } from './lib/merkle/merkle_tree.js';
import { Level } from 'level';
import { LevelStore } from './lib/store/level_store.js';

import { hashMessage, recoverPublicKey } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';

// [remove for actual use]
// clean the './db' folder as dynamic keypairs are used for each run
fs.rmSync('./db', { recursive: true, force: true });

describe('verifyOwnershipMembership', () => {
  let tree: MerkleTree<Field>;
  let merkleRoot: Field, merkleProof: MerkleProof, merkleIndex: Field;

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
    await verifyOwnershipMembershipProgram.compile({ cache });
    console.timeEnd('compile ZkProgram');

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
      await tree.update(3n, accountHashes[3]);
      await tree.update(4n, accountHashes[3]);
    }

    console.log('tree.getRoot', tree.getRoot().toString());
  });

  it('verify account[0] ownership + membership, it is in the list', async () => {
    console.log('=== sign with viem');
    const signature0 = await accounts[0].signMessage({ message });
    console.log('signature0', signature0);

    const publicKeyHex = await recoverPublicKey({
      hash: hashMessage(message),
      signature: signature0,
    });

    console.log('recovered public key', publicKeyHex);

    // const ethereumAddressFields = Keccak.ethereum(Bytes.fromHex(publicKeyHex.substring(2))).toFields().slice(12);

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

    // publicKey: 0x + X + Y
    let bytesOfXY = Bytes64.fromHex(publicKeyHex.substring(4));

    let signature = Ecdsa.fromHex(signature0);
    let msgHash = Scalar.from(BigInt(hashMessage(message)));
    let publicKeyCurve = Secp256k1.from(publicKeyPoint);

    merkleRoot = tree.getRoot();
    merkleProof = await tree.prove(0n);
    merkleIndex = Field(0n);

    let proof =
      await verifyOwnershipMembershipProgram.verifyOwnershipMembership(
        msgHash,
        signature,
        publicKeyCurve,
        merkleRoot,
        merkleProof,
        merkleIndex,
        bytesOfXY
      );

    //proof.publicOutput.assertTrue('signature wrong');
    expect(proof.publicOutput).toEqual(Bool(true));
    assert(await verifyOwnershipMembershipProgram.verify(proof), 'proof wrong');
  });

  it('verify accounts[0] ownership + membership, with accounts[1] signature', async () => {
    console.log('=== sign with viem');
    const signature0 = await accounts[1].signMessage({ message }); // sign with accounts[1]
    console.log('signature0', signature0);

    const publicKeyHex = await recoverPublicKey({
      hash: hashMessage(message),
      signature: signature0,
    });

    console.log('recovered public key', publicKeyHex);

    // const ethereumAddressFields = Keccak.ethereum(Bytes.fromHex(publicKeyHex.substring(2))).toFields().slice(12);

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

    // publicKey: 0x + X + Y
    let bytesOfXY = Bytes64.fromHex(publicKeyHex.substring(4));

    let signature = Ecdsa.fromHex(signature0);
    let msgHash = Scalar.from(BigInt(hashMessage(message)));
    let publicKeyCurve = Secp256k1.from(publicKeyPoint);

    merkleRoot = tree.getRoot();
    merkleProof = await tree.prove(0n);
    merkleIndex = Field(0n);

    expect(async () => {
      let proof =
        await verifyOwnershipMembershipProgram.verifyOwnershipMembership(
          msgHash,
          signature,
          publicKeyCurve,
          merkleRoot,
          merkleProof,
          merkleIndex,
          bytesOfXY
        );
    }).rejects.toThrow('checkMembership failed');
  });

  it('verify accounts[4] ownership + membership, it is not in the list', async () => {
    console.log('=== sign with viem');
    const signature4 = await accounts[0].signMessage({ message });
    console.log('signature4', signature4);

    const publicKeyHex = await recoverPublicKey({
      hash: hashMessage(message),
      signature: signature4,
    });

    console.log('recovered public key', publicKeyHex);

    // const ethereumAddressFields = Keccak.ethereum(Bytes.fromHex(publicKeyHex.substring(2))).toFields().slice(12);

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

    // publicKey: 0x + X + Y
    let bytesOfXY = Bytes64.fromHex(publicKeyHex.substring(4));

    let signature = Ecdsa.fromHex(signature4);
    let msgHash = Scalar.from(BigInt(hashMessage(message)));
    let publicKeyCurve = Secp256k1.from(publicKeyPoint);

    merkleRoot = tree.getRoot();
    merkleProof = await tree.prove(0n);
    merkleIndex = Field(0n);

    expect(async () => {
      let proof =
        await verifyOwnershipMembershipProgram.verifyOwnershipMembership(
          msgHash,
          signature,
          publicKeyCurve,
          merkleRoot,
          merkleProof,
          merkleIndex,
          bytesOfXY
        );
    }).rejects.toThrow('checkMembership failed');
  });
});
