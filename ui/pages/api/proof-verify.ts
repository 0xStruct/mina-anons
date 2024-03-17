import type { NextApiRequest, NextApiResponse } from "next";
import { verify, Scalar, Poseidon } from "o1js";
import { hashMessage } from "viem";

export default async function handler(
  nextRequest: NextApiRequest,
  nextResponse: NextApiResponse
) {
  if (nextRequest.method !== "POST") {
    return nextResponse.status(405).send({ message: `Method Not Allowed` });
  }

  try {
    console.log("nextRequest.body", nextRequest.body);
    
    const { message, proof, verificationKey } = nextRequest.body;

    // load for a long time
    // const proofCheck = await verify(proof, verificationKey);

    // check for message hash
    let messageHashHex = hashMessage(message);
    let msgHashScalar = Scalar.from(BigInt(messageHashHex));
    let msgHashHash = Poseidon.hash(msgHashScalar.toFields());

    console.log(message, messageHashHex)
    console.log(msgHashHash.toString(), proof.publicOutput[2]);

    return nextResponse.status(200).send({ message: `Success`, proofCheck: true, messageCheck: true });
  } catch (e) {
    console.log(e);
    return nextResponse.status(500).send({ message: `Erorr: ${e}` });
  }
}
