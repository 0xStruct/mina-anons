import {
  ZkProgram,
  Crypto,
  createEcdsa,
  createForeignCurve,
  Bool,
} from "o1js";

export { verifyEcdsaOwnershipProgram, Secp256k1, Ecdsa, Scalar };

class Secp256k1 extends createForeignCurve(Crypto.CurveParams.Secp256k1) {}
class Scalar extends Secp256k1.Scalar {}
class Ecdsa extends createEcdsa(Secp256k1) {}

const verifyEcdsaOwnershipProgram = ZkProgram({
  name: "verify-ecdsa-ownership",
  publicInput: Scalar.provable,
  publicOutput: Bool,

  methods: {
    verifySignedHash: {
      privateInputs: [Ecdsa.provable, Secp256k1.provable],
      method(message: Scalar, signature: Ecdsa, publicKey: Secp256k1) {
        // verify signature, and hence ownership
        // verifySignedHash is used instead to abstract out quirks with message prefix 
        return signature.verifySignedHash(message, publicKey);
      },
    },
  },
});
