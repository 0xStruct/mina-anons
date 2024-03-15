import type { NextApiRequest, NextApiResponse } from "next";
import { MemoryStore } from "../../src/contracts/lib/store/memory_store";
import { MerkleTree } from "../../src/contracts/lib/merkle/merkle_tree";

import { Bytes, Field, Poseidon } from "o1js";
import { privateKeyToAccount } from "viem/accounts";

let tree: MerkleTree<Field>;
let store: MemoryStore<Field> = new MemoryStore<Field>();

// these a throw-away privateKeys, generated randomly
const PRIVATE_KEYS: `0x${string}`[] = [
  "0x23a6856c2506f416cd3d8c2383cd13550b497490265bafabec57917575637846",
  "0x42aa063351f5aedcc3a1fe9c5167e41ec6e33c3826a53ea62567c8bae3089836",
  "0x5785b8988f3b496a9844da71197dc9a641e865edcb5d975908102dc67058d8bd",
  "0xd76db099c34f31a1a363c671dbecea425e42326361e25ea5bb31beb84400cec3",
  "0x9342f63dc524e79ac5624aae5992ec515c8083b1d3e923521254d52203166b72",
];

// create accounts with viem
let accounts = [
  privateKeyToAccount(PRIVATE_KEYS[0]),
  privateKeyToAccount(PRIVATE_KEYS[1]),
  privateKeyToAccount(PRIVATE_KEYS[2]),
  privateKeyToAccount(PRIVATE_KEYS[3]),
  privateKeyToAccount(PRIVATE_KEYS[4]),
];

// create a merkleTree with 5 members
let accountHashes = [
  Poseidon.hash(Bytes.fromHex(accounts[0].address.substring(2)).toFields()),
  Poseidon.hash(Bytes.fromHex(accounts[1].address.substring(2)).toFields()),
  Poseidon.hash(Bytes.fromHex(accounts[2].address.substring(2)).toFields()),
  Poseidon.hash(Bytes.fromHex(accounts[3].address.substring(2)).toFields()),
  Poseidon.hash(Bytes.fromHex(accounts[4].address.substring(2)).toFields()),
];

type ResponseData = {
  message: string;
};

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const { merkleProofIndex, address0 } = request.query;

  // build MerkleTree in memory store
  tree = await MerkleTree.build<Field>(store, 8, Field);

  let accountHash0 = address0 ? Poseidon.hash(Bytes.fromHex(String(address0).substring(2)).toFields()) : accountHashes[0];

  await tree.update(0n, accountHash0);
  await tree.update(1n, accountHashes[1]);
  await tree.update(2n, accountHashes[2]);
  await tree.update(3n, accountHashes[3]);
  await tree.update(4n, accountHashes[4]);

  let merkleProof = await tree.prove(BigInt(String(merkleProofIndex)));
  let merkleProofJSON = merkleProof.toJSON();

  return response.status(200).send({ message: `success`, merkleProofIndex, merkleProofJSON });
}
