import {
    ZkProgram,
    Bool,
    Field,
    Bytes,
  } from "o1js";
  import { ProvableMerkleTreeUtils } from './lib/merkle/verify_circuit.js';

  export { verifyBIP340MembershipProgram, MerkleProof, Bytes64 };
  
  class MerkleProof extends ProvableMerkleTreeUtils.MerkleProof(8) {}
  class Bytes64 extends Bytes(64) {}  
  
  const verifyBIP340MembershipProgram = ZkProgram({
    name: "verifyBIP340membership",
    publicInput: Field,
    publicOutput: Bool,
  
    methods: {
      verifyMembership: {
        privateInputs: [MerkleProof, Field, Field],
        method(merkleRoot: Field, merkleProof: MerkleProof, merkleIndex: Field, leafHash: Field) {

            // check for inclusion
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
  