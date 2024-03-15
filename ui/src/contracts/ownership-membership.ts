import {
  ZkProgram,
  Crypto,
  createEcdsa,
  createForeignCurve,
  Bool,
  Field,
  Keccak,
  Bytes,
  Poseidon,
  Provable,
  Struct
} from 'o1js';

import { ProvableMerkleTreeUtils } from './lib/merkle/verify_circuit';

export {
  verifyOwnershipMembershipProgram,
  Secp256k1,
  Ecdsa,
  Scalar,
  MerkleProof,
  Bytes64,
};

class MerkleProof extends ProvableMerkleTreeUtils.MerkleProof(8) {}
class Bytes64 extends Bytes(64) {}

class Secp256k1 extends createForeignCurve(Crypto.CurveParams.Secp256k1) {}
class Scalar extends Secp256k1.Scalar {}
class Ecdsa extends createEcdsa(Secp256k1) {}

export class PublicOutput extends Struct({
  verifiedOwnership: Bool,
  verifiedMembership: Bool,
  merkleRoot: Field,
}) {}

const verifyOwnershipMembershipProgram = ZkProgram({
  name: 'ownership-membership-program',
  publicInput: Scalar.provable,
  publicOutput: PublicOutput,

  methods: {
    verifyOwnershipInclusion: {
      privateInputs: [
        Ecdsa.provable,
        Secp256k1.provable,
        Field,
        MerkleProof,
        Field,
        Bytes64.provable,
      ],
      method(
        message: Scalar,
        signature: Ecdsa,
        publicKey: Secp256k1,
        merkleRoot: Field,
        merkleProof: MerkleProof,
        merkleIndex: Field,
        bytesOfXY: Bytes64
      ): PublicOutput {
        // check for inclusion
        const ethAddressFields = Keccak.ethereum(bytesOfXY)
          .toFields()
          .slice(12); // take only the last 20


        // check that bytes of X and Y are equal to those from publicKey.x publicKey.y
        // 32 bytes, 256 bits
        const publicKeyXBits = publicKey.x.toBits();
        const publicKeyYBits = publicKey.y.toBits();

        // check X's first and last bytes
        Field.fromBits(publicKeyXBits.slice(0, 8)).assertEquals(
          bytesOfXY.bytes[31].value
        );
        Field.fromBits(publicKeyXBits.slice(31 * 8, 32 * 8)).assertEquals(
          bytesOfXY.bytes[0].value
        );

        // check Y's first and last bytes
        Field.fromBits(publicKeyYBits.slice(0, 8)).assertEquals(
          bytesOfXY.bytes[63].value
        );
        Field.fromBits(publicKeyYBits.slice(31 * 8, 32 * 8)).assertEquals(
          bytesOfXY.bytes[32].value
        );

        // Provable.log("check publicKey (in bytes) vs publicKey (in curve) done");

        // check for inclusion
        const leafHash = Poseidon.hash(ethAddressFields);
        // Provable.log("leafHash", leafHash);

        const verifiedMembership = ProvableMerkleTreeUtils.checkMembership(
          merkleProof,
          merkleRoot,
          merkleIndex,
          leafHash,
          Field
        ); //.assertTrue('checkMembership failed');

        const verifiedOwnership = signature.verifySignedHash(message, publicKey);

        // verify signature - ownership
        return {
          verifiedOwnership,
          verifiedMembership,
          merkleRoot
        }
      },
    },
  },
});

export class verifyOwnershipMembershipProof extends ZkProgram.Proof(verifyOwnershipMembershipProgram) {}
