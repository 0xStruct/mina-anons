import type { NextApiRequest, NextApiResponse } from "next";
import { MemoryStore } from "@/contracts/lib/store/memory_store";
import { MerkleTree } from "@/contracts/lib/merkle/merkle_tree";

import { Bytes, Field, Poseidon, Point } from "o1js";

import { BIP340_ACCOUNTS } from "@/config";

let tree: MerkleTree<Field>;
let store: MemoryStore<Field> = new MemoryStore<Field>();

let publicKeyPoints = [
  Point.from({
    x: BIP340_ACCOUNTS[0].publicKeyPoint.px,
    y: BIP340_ACCOUNTS[0].publicKeyPoint.py,
  }),
  Point.from({
    x: BIP340_ACCOUNTS[1].publicKeyPoint.px,
    y: BIP340_ACCOUNTS[1].publicKeyPoint.py,
  }),
  Point.from({
    x: BIP340_ACCOUNTS[2].publicKeyPoint.px,
    y: BIP340_ACCOUNTS[2].publicKeyPoint.py,
  }),
  Point.from({
    x: BIP340_ACCOUNTS[3].publicKeyPoint.px,
    y: BIP340_ACCOUNTS[3].publicKeyPoint.py,
  }),
  Point.from({
    x: BIP340_ACCOUNTS[4].publicKeyPoint.px,
    y: BIP340_ACCOUNTS[4].publicKeyPoint.py,
  }),
];

// create a merkleTree with 5 members
let accountHashes = [
  Poseidon.hash(publicKeyPoints[0].x),
  Poseidon.hash(publicKeyPoints[1].x),
  Poseidon.hash(publicKeyPoints[2].x),
  Poseidon.hash(publicKeyPoints[3].x),
  Poseidon.hash(publicKeyPoints[4].x),
];

type ResponseData = {
  message: string;
};

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const { merkleProofIndex } = request.query;

  // build MerkleTree in memory store
  tree = await MerkleTree.build<Field>(store, 8, Field);

  await tree.update(0n, accountHashes[0]);
  await tree.update(1n, accountHashes[1]);
  await tree.update(2n, accountHashes[2]);
  await tree.update(3n, accountHashes[3]);
  await tree.update(4n, accountHashes[4]);  

  let merkleProof = await tree.prove(BigInt(String(merkleProofIndex)));
  let merkleProofJSON = merkleProof.toJSON();

  return response.status(200).send({ message: `success`, merkleProofIndex, merkleProofJSON });
}
