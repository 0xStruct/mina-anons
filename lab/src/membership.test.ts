import {
  verifyMembershipProgram,
  MerkleProof,
  Bytes64,
} from './membership.js';
import { Cache, Gadgets, Poseidon, Field, Bytes, Bool } from 'o1js';

import fs from 'fs';

import { MerkleTree } from './lib/merkle/merkle_tree.js';
import { Level } from 'level';
import { LevelStore } from './lib/store/level_store.js';

import { hashMessage } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';

// [remove for actual use]
// clean the './db' folder as dynamic keypairs are used for each run
fs.rmSync('./db', { recursive: true, force: true });

describe('verifyMembership', () => {
  let tree: MerkleTree<Field>;
  let merkleRoot: Field, merkleProof: MerkleProof, merkleIndex: Field;

  // create accounts with viem
  let privateKeys = [
    generatePrivateKey(),
    generatePrivateKey(),
    generatePrivateKey(),
    generatePrivateKey(),
    generatePrivateKey()
  ];

  let accounts = [
    privateKeyToAccount(privateKeys[0]),
    privateKeyToAccount(privateKeys[0]),
    privateKeyToAccount(privateKeys[0]),
    privateKeyToAccount(privateKeys[0]),
    privateKeyToAccount(privateKeys[0]),
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
    await verifyMembershipProgram.compile({ cache });
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

    console.log("tree.getRoot", tree.getRoot().toString());
  });

  it('verify account[0] is at 0n on the merkleTree, should be true', async () => {
    
    const publicKeyHex = accounts[0].publicKey;

    console.log('publicKey of privateKey', publicKeyHex);

    // const ethereumAddressFields = Keccak.ethereum(Bytes.fromHex(publicKeyHex.substring(2))).toFields().slice(12);

    // publicKeyPoint is derived from X and Y point of the publickey which can be recovered from signature
    // its format is 0x + X + Y
    console.log('publicKey X, Y', publicKeyHex.substring(4, 68), publicKeyHex.substring(68));

    // publicKey: 0x + X + Y
    let bytesOfXY = Bytes64.fromHex(publicKeyHex.substring(4));

    merkleRoot = tree.getRoot();
    merkleProof = await tree.prove(0n);
    merkleIndex = Field(0n);

    let proof = await verifyMembershipProgram.verifyMembership(
      merkleRoot,
      merkleProof,
      merkleIndex,
      bytesOfXY
    );

    //proof.publicOutput.assertTrue('non-membership');
    console.log(proof.publicOutput)
    expect(proof.publicOutput).toEqual(Bool(true));
  });

  it('verify account[4] is at 4n on the merkleTree, should be true', async () => {
    
    const publicKeyHex = accounts[4].publicKey;

    console.log('publicKey of privateKey', publicKeyHex);

    // const ethereumAddressFields = Keccak.ethereum(Bytes.fromHex(publicKeyHex.substring(2))).toFields().slice(12);

    // publicKeyPoint is derived from X and Y point of the publickey which can be recovered from signature
    // its format is 0x + X + Y
    console.log('publicKey X, Y', publicKeyHex.substring(4, 68), publicKeyHex.substring(68));

    // publicKey: 0x + X + Y
    let bytesOfXY = Bytes64.fromHex(publicKeyHex.substring(4));

    merkleRoot = tree.getRoot();
    merkleProof = await tree.prove(4n);
    merkleIndex = Field(4n);

    let proof = await verifyMembershipProgram.verifyMembership(
      merkleRoot,
      merkleProof,
      merkleIndex,
      bytesOfXY
    );

    //proof.publicOutput.assertTrue('non-membership');
    console.log(proof.publicOutput)
    expect(proof.publicOutput).toEqual(Bool(true));
  });

  it('verify account[1] is at 4n on the merkleTree, should be true', async () => {
    
    const publicKeyHex = accounts[1].publicKey;

    console.log('publicKey of privateKey', publicKeyHex);

    // const ethereumAddressFields = Keccak.ethereum(Bytes.fromHex(publicKeyHex.substring(2))).toFields().slice(12);

    // publicKeyPoint is derived from X and Y point of the publickey which can be recovered from signature
    // its format is 0x + X + Y
    console.log('publicKey X, Y', publicKeyHex.substring(4, 68), publicKeyHex.substring(68));

    // publicKey: 0x + X + Y
    let bytesOfXY = Bytes64.fromHex(publicKeyHex.substring(4));

    merkleRoot = tree.getRoot();
    merkleProof = await tree.prove(1n);
    merkleIndex = Field(4n);

    let proof = await verifyMembershipProgram.verifyMembership(
      merkleRoot,
      merkleProof,
      merkleIndex,
      bytesOfXY
    );

    //proof.publicOutput.assertTrue('non-membership');
    console.log(proof.publicOutput)
    expect(proof.publicOutput).toEqual(Bool(false));
  });

});
