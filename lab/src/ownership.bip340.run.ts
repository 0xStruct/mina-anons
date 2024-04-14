import { verifyBIP340OwnershipProgram } from './ownership.bip340.js';
import { Gadgets, Crypto, Cache } from 'o1js';
// @ts-ignore
import { Point, Ecdsa } from '../../node_modules/o1js/dist/node/lib/gadgets/elliptic-curve.js';
// import { Point, Ecdsa } from 'o1js'; // if available after patching

const Secp256k1 = Crypto.createCurve(Crypto.CurveParams.Secp256k1);

let publicKey1 = Secp256k1.scale(
  Secp256k1.one,
  0xb7e151628aed2a6abf7158809cf4f3c762e7160f38b4da56a784d9045190cfefn
);

let publicKey2 = Secp256k1.scale(
  Secp256k1.one,
  0xc90fdaa22168c234c4c6628b80dc1cd129024e088a67cc74020bbea63b14e5c9n
);

let publicKeyPoint1 = Point.from({
  x: publicKey1.x,
  y: publicKey1.y,
});

let publicKeyPoint2 = Point.from({
  x: publicKey2.x,
  y: publicKey2.y,
});

let signature1 = Ecdsa.Signature.fromHex(
  '0x6896bd60eeae296db48a229ff71dfe071bde413e6d43f917dc8dcf8c78de33418906d11ac976abccb20b091292bff4ea897efcb639ea871cfa95f6de339e4b0a'
);

let signature2 = Ecdsa.Signature.fromHex(
  '0x5831aaeed7b44bb74e5eab94ba9d4294c49bcf2a60728d8b4c200f50dd313c1bab745879a5ad954a72c45a91c3a51d3c7adea98d82f8481e0e1e03674a6f3fb7'
);

// e = int(hashBIP0340/challenge(bytes(r) || bytes(P) || m)) mod n.
let e1 =
  Gadgets.Field3.from(
    93949542165706944001660866409936821093384992946842435162876695386345791128474n
  );
let e2 =
  Gadgets.Field3.from(
    70450778734895434334655249143454831359357261206085335765708021653002017907034n
  );

console.log('compiling ZkProgram ...');
console.time('compile ZkProgram');
const cache: Cache = Cache.FileSystem('./cache');
await verifyBIP340OwnershipProgram.compile({ cache });
console.timeEnd('compile ZkProgram');

console.log("TEST #1: verifying publicKey1 with signature1, should be true");
let proof = await verifyBIP340OwnershipProgram.verifyBIP340(
  e1,
  signature1,
  publicKeyPoint1
);

proof.publicOutput.assertTrue();
console.log("TEST #1: verifying publicKey1 with signature1, should be true:", proof.publicOutput.toBoolean());
// assert(await verifyBIP340OwnershipProgram.verify(proof), 'proof wrong');

console.log("TEST #2: verifying publicKey2 with signature2, should be true");
proof = await verifyBIP340OwnershipProgram.verifyBIP340(
  e2,
  signature2,
  publicKeyPoint2
);

proof.publicOutput.assertTrue();
console.log("TEST #2: verifying publicKey2 with signature2, should be true:", proof.publicOutput.toBoolean());
// assert(await verifyBIP340OwnershipProgram.verify(proof), 'proof wrong');

console.log("TEST #3: verifying publicKey2 with signature1, should be false");
proof = await verifyBIP340OwnershipProgram.verifyBIP340(
  e2,
  signature1,
  publicKeyPoint2
);

proof.publicOutput.assertFalse();
console.log("TEST #3: verifying publicKey2 with signature1, should be false:", proof.publicOutput.toBoolean());
// assert(await verifyBIP340OwnershipProgram.verify(proof), 'proof wrong');
