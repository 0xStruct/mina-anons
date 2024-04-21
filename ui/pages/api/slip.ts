import type { NextApiRequest, NextApiResponse } from "next";

import { Bytes, Field, Poseidon, Keccak, Signature, PrivateKey} from "o1js";
import { recoverPublicKey, hashMessage } from "viem";
import { privateKeyToAccount } from "viem/accounts";

class Bytes64 extends Bytes(64) {}

type ResponseData = {
  message: string;
};

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {

  try {
    // get voting slip_id for a specific proposal
    // inputs: signature, proposal, space
    const { signature, proposal, space } = request.query;

    // const account = privateKeyToAccount(
    //   "0x23a6856c2506f416cd3d8c2383cd13550b497490265bafabec57917575637846"
    // );
    // const proposal = "0xfc255b04d5a5e9d39b8aa63694ccd20eed46eec651ae5c2332397f646312db5a";
    // const space = "mina-anons.eth";
    // const signature = await account.signMessage({ message: space+'/proposal/'+proposal });
    
    // get publicKeyHex from the signature
    const publicKeyHex = await recoverPublicKey({
      hash: hashMessage(space + "/proposal/" + proposal),
      // @ts-ignore
      signature: signature,
    });

    // console.log(account.address, publicKeyHex, signature);

    // outputs: unique identifier for the account **signed by oracle**

    // publicKey: 0x + X + Y
    let bytesOfXY = Bytes64.fromHex(publicKeyHex.substring(4));
    const ethAddressFields = Keccak.ethereum(bytesOfXY)
          .toFields()
          .slice(12); // take only the last 20

    // unique identifier
    const slip_id = Poseidon.hash([
      Poseidon.hash(ethAddressFields),
      Field(process.env.ORACLE_SECRET!),
      // Field(BigInt(hashMessage(space+'/proposal/'+proposal)))
    ]);

    // Oracle Public and Private Key
    const oracle_privateKey = PrivateKey.fromBase58(
      process.env.ORACLE_PRIVATE_KEY!
    );
    const oracle_publicKey = oracle_privateKey.toPublicKey();
    const oracle_signature = Signature.create(oracle_privateKey, [slip_id]).toBase58();

    return response.send({
      data: { slip_id },
      oracle_signature: oracle_signature,
      oracle_publicKey: oracle_publicKey,
    });
  } catch (e) {
    console.log(e);

    return response.status(400).send({ error: e });
  }
}
