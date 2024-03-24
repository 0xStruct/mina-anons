// This is a module worker, so we can use imports (in the browser too!)
import { recoverPublicKey } from "viem";

const sleep = (delay: number) =>
  new Promise((resolve) => setTimeout(resolve, delay));

/*
addEventListener("message", async (event: any) => {
  console.log(event.data);
  const res = await fetch(
    "https://random-word-api.herokuapp.com/word?number=1"
  );
  const json = await res.json();

  console.log(json);
  postMessage({d: json[0]});
});
*/

const loadForProof = async () => {
  const { Cache, Field, Gadgets, Poseidon, ZkProgram } = await import("o1js");

  const {
    verifyOwnershipMembershipProgram,
    MerkleProof,
    Secp256k1,
    Ecdsa,
    Scalar,
    Bytes64,
  } = await import("@/contracts/ownership-membership");

  return {
    Cache,
    Field,
    Gadgets,
    Poseidon,
    ZkProgram,
    verifyOwnershipMembershipProgram,
    MerkleProof,
    Secp256k1,
    Ecdsa,
    Scalar,
    Bytes64,
  };
};

addEventListener("message", async (e: any) => {
  postMessage({ message: "proof-worker-start" });
  // load o1js and ZkProgram async
  const {
    Cache,
    Field,
    Gadgets,
    Poseidon,
    verifyOwnershipMembershipProgram,
    MerkleProof,
    Secp256k1,
    Ecdsa,
    Scalar,
    Bytes64,
  } = await loadForProof();

  postMessage({ message: "imported-o1js" });

  const { messageHashHex, signatureHex, merkleProofJSON, merkleProofIndex } =
    JSON.parse(e.data);

  console.log(messageHashHex, signatureHex, merkleProofJSON, merkleProofIndex);

  const publicKeyHex = await recoverPublicKey({
    hash: messageHashHex,
    signature: signatureHex!,
  });

  console.log("recovered public key", publicKeyHex);

  let publicKeyPoint = {
    x: Gadgets.Field3.from(BigInt("0x" + publicKeyHex.substring(4, 68))),
    y: Gadgets.Field3.from(BigInt("0x" + publicKeyHex.substring(68))),
  };

  postMessage({ message: "compiling-zkrogram" });
  // const cache: Cache = Cache.FileSystem("./cache");
  // const { verificationKey } = await verifyOwnershipMembershipProgram.compile({
  //   cache,
  // }); // use cache for faster compilation

  const { verificationKey } = await verifyOwnershipMembershipProgram.compile();
  postMessage({ message: "compiled-zkprogram" });

  console.log("verificationKey", verificationKey);

  // publicKey: 0x + X + Y
  let bytesOfXY = Bytes64.fromHex(publicKeyHex.substring(4));

  let signatureEcdsa = Ecdsa.fromHex(signatureHex!);
  let msgHashScalar = Scalar.from(BigInt(messageHashHex));
  let publicKeyCurve = Secp256k1.from(publicKeyPoint);

  let msgHashHash = Poseidon.hash(msgHashScalar.toFields());

  postMessage({ message: "proof-start" });
  let proof = await verifyOwnershipMembershipProgram.verifyOwnershipInclusion(
    Field(merkleProofJSON.root),
    msgHashScalar,
    msgHashHash,
    signatureEcdsa,
    publicKeyCurve,
    MerkleProof.fromJSON(merkleProofJSON),
    Field(merkleProofIndex!),
    bytesOfXY
  );
  postMessage({ message: "proof-done" });
  console.log("proof done", proof.toJSON());
  console.log(proof.publicOutput);

  postMessage({ message: "proof-done", proof });

  // not necessary to re-verify, just for reference
  // const ok = await verify(proof.toJSON(), verificationKey);
  // console.log("proof verification", ok);
});
