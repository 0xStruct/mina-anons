import {
    ZkProgram,
    Bool,
    Field,
    Bytes,
    Keccak,
    Poseidon,
  } from "o1js";
  import { ProvableMerkleTreeUtils } from './lib/merkle/verify_circuit.js';

  export { verifyMembershipProgram, MerkleProof, Bytes64 };
  
  class MerkleProof extends ProvableMerkleTreeUtils.MerkleProof(8) {}
  class Bytes64 extends Bytes(64) {}  
  
  const verifyMembershipProgram = ZkProgram({
    name: "verify-membership",
    publicInput: Field,
    publicOutput: Bool,
  
    methods: {
      verifyMembership: {
        privateInputs: [MerkleProof, Field, Bytes64.provable],
        method(merkleRoot: Field, merkleProof: MerkleProof, merkleIndex: Field, bytesOfXY: Bytes64) {

            const ethAddressFields = Keccak.ethereum(bytesOfXY).toFields().slice(12); // take only the last 20

            // check for inclusion
            const leafHash = Poseidon.hash(ethAddressFields);

            let isOk = ProvableMerkleTreeUtils.checkMembership(
                merkleProof,
                merkleRoot,
                merkleIndex,
                leafHash,
                Field
              );
            
            // ownership of address needs to be verified further
            // this is done in ownership.ts
  
            return isOk;
        },
      },
    },
  });
  