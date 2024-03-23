import express from "express";
import { Request, Response } from "express";
import { PrivateKey, Field, Signature } from "o1js";
import snapshotJS from "@snapshot-labs/snapshot.js";

const dotenv = require("dotenv");
dotenv.config({ path: "./.env.local" });

const hub = "https://hub.snapshot.org"; // or https://testnet.hub.snapshot.org for testnet
const client = new snapshotJS.Client712(hub);

const settings = {
  network: "mainnet",
};

const app = express();
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send({
    message: "Voting Power Oracle",
  });
});

app.get("/vp", (req: Request, res: Response) => {
  const { address, space, snapshot } = req.query;

  if (!address || !space || !snapshot)
    return res.status(400).send({ error: "Param(s) missing" });

  console.log(address, space, snapshot);

  // Oracle Public and Private Key
  const privateKey = PrivateKey.fromBase58(process.env.PRIVATE_KEY);
  const publicKey = privateKey.toPublicKey();

  // const address = "0xa478c2975ab1ea89e8196811f51a7b7ade33eb11";
  // const snapshot = 11437846;
  // const space = "yam.eth";

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

	  const [vp1, vp2] = String(vp.vp).split(".");

      const signature = Signature.create(privateKey, [Field(BigInt(vp1)), Field(BigInt(vp2))]);

      return res.send({
        data: { vp: vp.vp, vp_by_strategy: vp.vp_by_strategy },
        signature: signature,
        publicKey: publicKey,
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
