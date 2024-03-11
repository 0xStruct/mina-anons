import { verifyInclusionProgram, Bytes64, MerkleProof } from './inclusion.js';
import { Keccak, Poseidon, Field, Bytes } from 'o1js';
import assert from 'assert';

import { MerkleTree } from './lib/merkle/merkle_tree.js';
import { ProvableMerkleTreeUtils } from './lib/merkle/verify_circuit.js';
import { Level } from 'level';
import { LevelStore } from './lib/store/level_store.js';


console.log('###');

// off-chain persistence with levelDB
const levelDb = new Level<string, any>('./db');

let store: LevelStore<Field> = new LevelStore<Field>(
  levelDb,
  Field,
  'inclusionSet1'
);

// publicKey: 0x + X + Y
let bytesOfXY = Bytes64.fromHex(
  'dbaabad79c8bb070cab1c0b3dc262eff1f27971513e99f6f22367689805f3f9ecd6f35df4ac3139230e6f2013b2ebaa384122a9bd714df5980d0c2ba39db535c'
);

// hash is derived from publicKey point
let hash0 = Poseidon.hash(Keccak.ethereum(bytesOfXY).toFields().slice(12));

// hash is derived from eth addresses without 0x prefix
let hash1 = Poseidon.hash(
  Bytes.fromHex('AB3Dc529EF147414288f65ee7E166407B165b483').toFields()
);
let hash2 = Poseidon.hash(
  Bytes.fromHex('05912fD7D55a7f604c6080CAc5F86982eC199136').toFields()
);
let hash3 = Poseidon.hash(
  Bytes.fromHex('4C09CEDa6641d7036F6C6B6525068Dad5e8a2937').toFields()
);

let tree: MerkleTree<Field>;

try {
  // load from level store
  console.log('loading from off-chain storage levelDB ...');
  tree = await MerkleTree.import<Field>(store, 8, Field);
  console.log(tree.getRoot().toString());
} catch (e) {
  console.log('leveldb is not there, building tree ...');
  tree = await MerkleTree.build<Field>(store, 8, Field);

  await tree.update(0n, hash0);
  await tree.update(1n, hash1);
  await tree.update(2n, hash2);
  await tree.update(3n, hash3);
}

console.log('tree.getRoot', tree.getRoot().toString());

// now that we got our accounts set up, we need the commitment to deploy our contract!
const merkleRoot = tree.getRoot();

let merkleProof = await tree.prove(0n);
console.log('merkleProof.root', merkleProof.root.value);

// investigate the constraint system generated by ECDSA verify

console.time('verify inclusion (build constraint system)');
let program = await verifyInclusionProgram.analyzeMethods();
console.timeEnd('verify inclusion (build constraint system)');
console.log(program.verifyInclusion.summary());

// compile and prove

console.time('verify inclusion (compile)');
await verifyInclusionProgram.compile();
console.timeEnd('verify inclusion (compile)');

console.time('verify inclusion (prove)');
let proof = await verifyInclusionProgram.verifyInclusion(
  merkleRoot,
  merkleProof,
  Field(0n),
  bytesOfXY
);
console.timeEnd('verify inclusion (prove)');

proof.publicOutput.assertTrue('non-inclusion');
assert(await verifyInclusionProgram.verify(proof), 'proof wrong');
