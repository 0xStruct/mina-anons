// This is a module worker, so we can use imports (in the browser too!)
import { schnorrGetE } from "@/contracts/schnorrGetE";

// load o1js async 
const loadForProof = async () => {
  const { Cache, Field, Gadgets, Poseidon, ZkProgram, EllipticCurve, Point, Ecdsa } = await import("o1js");

  const {
    verifyBIP340OwnershipMembershipProgram,
    MerkleProof,
    Secp256k1,
    Bytes64,
  } = await import("@/contracts/ownership-membership.bip340");

  return {
    Cache,
    Field,
    Gadgets,
    Poseidon,
    ZkProgram,
    EllipticCurve,
    Point,
    Ecdsa,
    verifyBIP340OwnershipMembershipProgram,
    MerkleProof,
    Secp256k1,
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
    EllipticCurve,
    Point,
    Ecdsa,
    verifyBIP340OwnershipMembershipProgram,
    MerkleProof,
    Secp256k1,
    Bytes64,
  } = await loadForProof();

  postMessage({ message: "imported-o1js-async" });

  const { messageHash, signatureHex, publicKeyPoint, merkleProofJSON, merkleProofIndex } =
    JSON.parse(e.data);

  console.log(messageHash, signatureHex, publicKeyPoint, merkleProofJSON, merkleProofIndex);

  postMessage({ message: "compiling-zkrogram-start" });
  const cache = Cache.FileSystem("./cache");
  const { verificationKey } = await verifyBIP340OwnershipMembershipProgram.compile({
    cache,
  }); // use cache for faster compilation

  // const { verificationKey } = await verifyOwnershipMembershipProgram.compile();
  postMessage({ message: "compiled-zkprogram-done" });

  console.log("verificationKey", verificationKey);

  let messageHash_ = Gadgets.Field3.from(BigInt(messageHash));
  let signature_ = Ecdsa.Signature.fromHex('0x'+signatureHex);
  let publicKeyPoint_ = Point.from({
    x: BigInt(publicKeyPoint.x),
    y: BigInt(publicKeyPoint.y),
  })

  postMessage({ message: "proof-start" });
  let proof = await verifyBIP340OwnershipMembershipProgram.verifyBIP340OwnershipMembership(
    Field(merkleProofJSON.root),
    messageHash_,
    signature_,
    publicKeyPoint_,
    MerkleProof.fromJSON(merkleProofJSON),
    Field(merkleProofIndex!)
  );

  console.log("proof done", proof.toJSON(), proof.publicOutput, verificationKey);

  postMessage({ message: "proof-done", proof: proof.toJSON(), verificationKey: verificationKey});

  // not necessary to re-verify, just for reference
  // const ok = await verify(proof.toJSON(), verificationKey);
  // console.log("proof verification", ok);
});
