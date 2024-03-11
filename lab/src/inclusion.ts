import {
    ZkProgram,
    Bool,
    Field,
    Bytes,
    MerkleWitness,
    Keccak,
    Poseidon,
  } from "o1js";
  
  export { verifyInclusionProgram, MyMerkleWitness, Bytes64 };
  
  class MyMerkleWitness extends MerkleWitness(8) {}
  class Bytes64 extends Bytes(64) {}  
  
  const verifyInclusionProgram = ZkProgram({
    name: "verify-inclusion",
    publicInput: Field,
    publicOutput: Bool,
  
    methods: {
      verifyInclusion: {
        privateInputs: [MyMerkleWitness, Bytes64.provable],
        method(merkleRoot: Field, witness: MyMerkleWitness, bytesOfXY: Bytes64) {

            const ethAddressFields = Keccak.ethereum(bytesOfXY).toFields().slice(12); // take only the last 20

            // check for inclusion
            witness.calculateRoot(Poseidon.hash(ethAddressFields)).assertEquals(merkleRoot);
            
            // ownership of address needs to be verified further
            // this is done in ownership.ts
  
            return Bool(true);
        },
      },
    },
  });
  