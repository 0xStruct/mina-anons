import {
  ZkProgram,
  Crypto,
  createEcdsa,
  createForeignCurve,
  Bool,
  Field,
  Gadgets,
  Bytes,
  Poseidon,
  Struct,
} from 'o1js';

import { Point, Ecdsa } from 'o1js'; // if available after patching

import { verifyBIP340 } from './bip340Verify';

import { ProvableMerkleTreeUtils } from './lib/merkle/verify_circuit';

export {
  verifyBIP340OwnershipMembershipProgram,
  Secp256k1,
  MerkleProof,
  Bytes64,
};

class MerkleProof extends ProvableMerkleTreeUtils.MerkleProof(8) {}
class Bytes64 extends Bytes(64) {}

const Secp256k1 = Crypto.createCurve(Crypto.CurveParams.Secp256k1);

export class PublicOutput extends Struct({
  verifiedOwnership: Bool,
  verifiedMembership: Bool,
  messageHashHash: Field,
}) {}

const verifyBIP340OwnershipMembershipProgram = ZkProgram({
  name: 'BIP340-ownership-membership-program',
  publicInput: Field,
  publicOutput: PublicOutput,

  methods: {
    verifyBIP340OwnershipMembership: {
      privateInputs: [
        Gadgets.Field3.provable,
        Ecdsa.Signature.provable,
        Point.provable,
        MerkleProof,
        Field,
      ],
      method(
        merkleRoot: Field,
        messageHash: Gadgets.Field3,
        signature: { r: Gadgets.Field3; s: Gadgets.Field3 },
        publicKey: Point,
        merkleProof: MerkleProof,
        merkleIndex: Field,
      ): PublicOutput {

        // check for inclusion
        const leafHash = Poseidon.hash(publicKey.x); // leafHash is hash of publicKey X
        // Provable.log("leafHash", leafHash);

        const verifiedMembership = ProvableMerkleTreeUtils.checkMembership(
          merkleProof,
          merkleRoot,
          merkleIndex,
          leafHash,
          Field
        ); //.assertTrue('checkMembership failed');

        const verifiedOwnership = verifyBIP340(Secp256k1, signature, messageHash, publicKey);

        // verify signature - ownership
        return {
          verifiedOwnership,
          verifiedMembership,
          messageHashHash: Poseidon.hash(messageHash),
        };
      },
    },
  },
});

export class verifyBIP340OwnershipMembershipProof extends ZkProgram.Proof(
  verifyBIP340OwnershipMembershipProgram
) {}
