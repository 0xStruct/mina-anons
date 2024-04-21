import type { NextApiRequest, NextApiResponse } from "next";

import { Cache, Field, Gadgets, Keccak, Poseidon, verify, Signature } from "o1js";
import {
  snapshotVoteProofProgram,
  Secp256k1,
  Ecdsa,
  Scalar,
  Bytes64,
} from "@/contracts/snapshotVoteProof";

import { recoverPublicKey } from "viem";

type ResponseData = {
  message: string;
};

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  
  if (request.method !== "POST") {
    return response.status(405).send({ message: `Method Not Allowed` });
  }

  const { messageHashHex, signatureHex, oracle_signature, slip_id } = request.body;

  console.log("request.body", request.body);

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
  const { verificationKey } = await snapshotVoteProofProgram.compile({ cache }); // use cache for faster compilation
  console.log("compiled zkProgram ...");

  // publicKey: 0x + X + Y
  let bytesOfXY = Bytes64.fromHex(publicKeyHex.substring(4));

  let signatureEcdsa = Ecdsa.fromHex(signatureHex);
  let msgHashScalar = Scalar.from(BigInt(messageHashHex));
  let publicKeyCurve = Secp256k1.from(publicKeyPoint);

  let msgHashHash = Poseidon.hash(msgHashScalar.toFields());

  console.log("proof start");

  let proof = await snapshotVoteProofProgram.verify(
    msgHashScalar,
    msgHashHash,
    signatureEcdsa,
    publicKeyCurve,
    bytesOfXY,
    Signature.fromBase58(oracle_signature),
    Field(slip_id)
  );

  console.log("proof done", proof.toJSON());
  console.log(proof.publicOutput);

  const ok = await verify(proof.toJSON(), verificationKey);
  console.log("proof verification", ok);

  return response.status(200).send({ message: `success`, proof, verificationKey });
}
