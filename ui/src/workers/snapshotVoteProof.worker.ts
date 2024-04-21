// This is a module worker, so we can use imports (in the browser too!)
import { recoverPublicKey } from "viem";

// load o1js async
const loadForProof = async () => {
  const { Cache, Field, Gadgets, Poseidon, ZkProgram, Signature } =
    await import("o1js");

  const { snapshotVoteProofProgram, Secp256k1, Ecdsa, Scalar, Bytes64 } =
    await import("@/contracts/snapshotVoteProof");

  return {
    Cache,
    Field,
    Gadgets,
    Poseidon,
    ZkProgram,
    Signature,
    snapshotVoteProofProgram,
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
    ZkProgram,
    Signature,
    snapshotVoteProofProgram,
    Secp256k1,
    Ecdsa,
    Scalar,
    Bytes64,
  } = await loadForProof();

  postMessage({ message: "imported-o1js-async" });

  const { messageHashHex, signatureHex, oracle_signature, slip_id } =
    JSON.parse(e.data);

  console.log(messageHashHex, signatureHex, oracle_signature, slip_id);

  const publicKeyHex = await recoverPublicKey({
    hash: messageHashHex,
    signature: signatureHex!,
  });

  console.log("recovered public key", publicKeyHex);

  let publicKeyPoint = {
    x: Gadgets.Field3.from(BigInt("0x" + publicKeyHex.substring(4, 68))),
    y: Gadgets.Field3.from(BigInt("0x" + publicKeyHex.substring(68))),
  };

  postMessage({ message: "compiling-zkrogram-start" });
  const cache = Cache.FileSystem("./cache");
  const { verificationKey } = await snapshotVoteProofProgram.compile({
    cache,
  }); // use cache for faster compilation
  // const { verificationKey } = await verifyOwnershipMembershipProgram.compile();
  postMessage({ message: "compiled-zkprogram-done" });

  console.log("verificationKey", verificationKey);

  // publicKey: 0x + X + Y
  let bytesOfXY = Bytes64.fromHex(publicKeyHex.substring(4));

  let signatureEcdsa = Ecdsa.fromHex(signatureHex!);
  let msgHashScalar = Scalar.from(BigInt(messageHashHex));
  let publicKeyCurve = Secp256k1.from(publicKeyPoint);

  let msgHashHash = Poseidon.hash(msgHashScalar.toFields());

  let proof = await snapshotVoteProofProgram.verify(
    msgHashScalar,
    msgHashHash,
    signatureEcdsa,
    publicKeyCurve,
    bytesOfXY,
    Signature.fromBase58(oracle_signature),
    Field(slip_id)
  );

  console.log(
    "proof done",
    proof.toJSON(),
    proof.publicOutput,
    verificationKey
  );

  postMessage({
    message: "proof-done",
    proof: proof.toJSON(),
    verificationKey: verificationKey,
  });

  // not necessary to re-verify, just for reference
  // const ok = await verify(proof.toJSON(), verificationKey);
  // console.log("proof verification", ok);
});
