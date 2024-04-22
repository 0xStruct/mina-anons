import express from "express";
import { Request, Response } from "express";
import { Bytes, PrivateKey, Field, Signature, Poseidon, Keccak } from "o1js";
import snapshotJS from "@snapshot-labs/snapshot.js";
import { recoverPublicKey, hashMessage } from "viem";
import { privateKeyToAccount } from "viem/accounts";

class Bytes64 extends Bytes(64) {}

const dotenv = require("dotenv");
dotenv.config({ path: "./.env.local" });

const hub = "https://testnet.hub.snapshot.org"; // or https://hub.snapshot.org for testnet
const client = new snapshotJS.Client712(hub);

const settings = {
  network: "mainnet",
};

const app = express();
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send({
    message: "Snapshot Vote Oracle",
  });
});

app.get("/slip", async (req: Request, res: Response) => {
  try {
    // get voting slip_id for a specific proposal
    // inputs: signature, proposal, space
    // const { signature, proposal, space } = req.query;

    const account = privateKeyToAccount(
      "0x23a6856c2506f416cd3d8c2383cd13550b497490265bafabec57917575637846"
    );
    const proposal = "0xfc255b04d5a5e9d39b8aa63694ccd20eed46eec651ae5c2332397f646312db5a";
    const space = "mina-anons.eth";
    const signature = await account.signMessage({ message: space+'/proposal/'+proposal });
    
    // get publicKeyHex from the signature
    const publicKeyHex = await recoverPublicKey({
      hash: hashMessage(space + "/proposal/" + proposal),
      // @ts-ignore
      signature: signature,
    });

    console.log(account.address, publicKeyHex, signature);

    // outputs: unique identifier for the account **signed by oracle**

    // publicKey: 0x + X + Y
    let bytesOfXY = Bytes64.fromHex(publicKeyHex.substring(4));
    const ethAddressFields = Keccak.ethereum(bytesOfXY)
          .toFields()
          .slice(12); // take only the last 20

    // unique identifier
    const slip_id = Poseidon.hash([
      Poseidon.hash(ethAddressFields),
      Field(process.env.ORACLE_SECRET),
      // Field(BigInt(hashMessage(space+'/proposal/'+proposal)))
    ]);

    // Oracle Public and Private Key
    const oracle_privateKey = PrivateKey.fromBase58(
      process.env.ORACLE_PRIVATE_KEY
    );
    const oracle_publicKey = oracle_privateKey.toPublicKey();
    const oracle_signature = Signature.create(oracle_privateKey, [slip_id]).toBase58();

    return res.send({
      data: { slip_id },
      oracle_signature: oracle_signature,
      oracle_publicKey: oracle_publicKey,
    });
  } catch (e) {
    console.log(e);

    return res.status(400).send({ error: e });
  }
});

app.get("/vp", (req: Request, res: Response) => {
  const { address, space, snapshot } = req.query;

  if (!address || !space || !snapshot)
    return res.status(400).send({ error: "Param(s) missing" });

  console.log(address, space, snapshot);

  // Oracle Public and Private Key
  const oracle_privateKey = PrivateKey.fromBase58(
    process.env.ORACLE_PRIVATE_KEY
  );
  const oracle_publicKey = oracle_privateKey.toPublicKey();

  // const address = "0xa478c2975ab1ea89e8196811f51a7b7ade33eb11";
  // const snapshot = 19758521;
  // const space = "mina-anons.eth";

  const network = "1";
  const strategies = [
    {
      name: "erc20-balance-of",
      params: {
        address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        symbol: "DAI",
        decimals: 18,
      },
    },
    /*{
      name: "erc20-balance-of",
      params: {
        symbol: "CODE",
      },
    },*/
  ];

  const delegation = false;
  const options = {
    url: `https://score.snapshot.org/?apiKey=${process.env.SNAPSHOT_API_KEY}`,
  };

  snapshotJS.utils
    .getVp(
      String(address),
      network,
      strategies,
      Number(snapshot),
      String(space),
      delegation,
      options
    )
    .then((vp) => {
      console.log(vp);

      let [vp1, vp2] = String(vp.vp).split(".");
      if (!vp2) vp2 = "0";

      const oracle_signature = Signature.create(oracle_privateKey, [
        Field(BigInt(vp1)),
        Field(BigInt(vp2)),
      ]);

      return res.send({
        data: { vp: vp.vp, vp_by_strategy: vp.vp_by_strategy },
        oracle_signature: oracle_signature,
        oracle_publicKey: oracle_publicKey,
      });
    })
    .catch((e) => {
      console.log(e);

      return res.status(400).send({ error: e });
    });
});

app.listen(process.env.PORT, () => {
  console.log(`Application started on port ${process.env.PORT}!`);
});
