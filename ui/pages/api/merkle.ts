import type { NextApiRequest, NextApiResponse } from "next";
import { MemoryStore } from "@/contracts/lib/store/memory_store";
import { MerkleTree } from "@/contracts/lib/merkle/merkle_tree";

import { Bytes, Field, Poseidon } from "o1js";

import { ACCOUNTS } from "@/config";

let tree: MerkleTree<Field>;
let store: MemoryStore<Field> = new MemoryStore<Field>();

// create a merkleTree with 5 members
let accountHashes = [
  Poseidon.hash(Bytes.fromHex(ACCOUNTS[0].address.substring(2)).toFields()),
  Poseidon.hash(Bytes.fromHex(ACCOUNTS[1].address.substring(2)).toFields()),
  Poseidon.hash(Bytes.fromHex(ACCOUNTS[2].address.substring(2)).toFields()),
  Poseidon.hash(Bytes.fromHex(ACCOUNTS[3].address.substring(2)).toFields()),
  Poseidon.hash(Bytes.fromHex(ACCOUNTS[4].address.substring(2)).toFields()),
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
