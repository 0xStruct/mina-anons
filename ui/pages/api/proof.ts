import type { NextApiRequest, NextApiResponse } from "next";

import fs from "fs";

import { Bytes, Cache, Field, Gadgets, Keccak, Poseidon, JsonProof } from "o1js";
import {
  verifyOwnershipMembershipProgram,
  verifyOwnershipMembershipProof,
  MerkleProof,
  Secp256k1,
  Ecdsa,
  Scalar,
  Bytes64,
} from "../../src/contracts/ownership-membership";

import { Level } from "level";
import { LevelStore } from "../../src/contracts/lib/store/level_store";
import { MerkleTree } from "../../src/contracts/lib/merkle/merkle_tree";

import { hashMessage, recoverPublicKey } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";

type ResponseData = {
  message: string;
};

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  
  // if (request.method !== "POST") {
  //   return response.status(405).send({ message: `Method Not Allowed` });
  // }

  const { messageHashHex, signatureHex, merkleProofJSON, merkleProofIndex } = request.body;

  console.log(request.body);

  const publicKeyHex = await recoverPublicKey({
    hash: messageHashHex,
    signature: signatureHex,
  });

  console.log("recovered public key", publicKeyHex);

  type Point = { x: Gadgets.Field3; y: Gadgets.Field3 };

  // publicKeyPoint is derived from X and Y point of the publickey which can be recovered from signature
  // its format is 0x + X + Y
  console.log(
    "publicKey X, Y",
    publicKeyHex.substring(4, 68),
    publicKeyHex.substring(68)
  );

  let publicKeyPoint: Point = {
    x: Gadgets.Field3.from(BigInt("0x" + publicKeyHex.substring(4, 68))),
    y: Gadgets.Field3.from(BigInt("0x" + publicKeyHex.substring(68))),
  };

  console.log("compiling zkProgram ...");
  const cache: Cache = Cache.FileSystem("./cache");
  await verifyOwnershipMembershipProgram.compile({ cache }); // use cache for faster compilation
  console.log("compiled zkProgram ...");

  // const ethereumAddressFields = Keccak.ethereum(Bytes.fromHex(publicKeyHex.substring(4))).toFields().slice(12);

  // publicKey: 0x + X + Y
  let bytesOfXY = Bytes64.fromHex(publicKeyHex.substring(4));

  let signature = Ecdsa.fromHex(signatureHex);
  let msgHash = Scalar.from(BigInt(messageHashHex));
  let publicKeyCurve = Secp256k1.from(publicKeyPoint);

  console.log("start proof")

  let proof = await verifyOwnershipMembershipProgram.verifyOwnershipInclusion(
    msgHash,
    signature,
    publicKeyCurve,
    Field(merkleProofJSON.root),
    MerkleProof.fromJSON(merkleProofJSON),
    Field(merkleProofIndex),
    bytesOfXY
  );

  console.log("done proof", proof.toJSON());
  console.log(proof.publicOutput);

  return response.status(200).send({ message: `success`, proof });
}
