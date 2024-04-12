import { Provable, ZkProgram, Bool, Gadgets, Crypto } from 'o1js';

// @ts-ignore
import { Point, Ecdsa } from '../../node_modules/o1js/dist/node/lib/gadgets/elliptic-curve.js';
// import { Point, Ecdsa } from 'o1js'; // if available after patching

import { verifyBIP340 } from './bip340Verify.js';

// const Secp256k1 = createCurveAffine(CurveParams.Secp256k1);
const Secp256k1 = Crypto.createCurve(Crypto.CurveParams.Secp256k1);

let publicKey1 = Secp256k1.scale(
  Secp256k1.one,
  0xb7e151628aed2a6abf7158809cf4f3c762e7160f38b4da56a784d9045190cfefn
);
console.log(
  'B7E151',
  publicKey1,
  publicKey1.x.toString(16),
  publicKey1.y.toString(16)
);

let publicKey2 = Secp256k1.scale(
  Secp256k1.one,
  0xc90fdaa22168c234c4c6628b80dc1cd129024e088a67cc74020bbea63b14e5c9n
);
console.log(
  'C90FDA',
  publicKey2,
  publicKey2.x.toString(16),
  publicKey2.y.toString(16)
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

let publicKey = publicKeyPoint2;
let signature = signature2;
let msgHash = e2; // pass the hashed message

let program = ZkProgram({
  name: 'verifyBIP340',
  publicOutput: Bool,
  methods: {
    verifyBIP340: {
      privateInputs: [],
      method() {
        let signature_ = Provable.witness(
          Ecdsa.Signature.provable,
          () => signature
        );
        let msgHash_ = Provable.witness(Gadgets.Field3.provable, () => msgHash);
        let publicKey_ = Provable.witness(Point.provable, () => publicKey);

        return verifyBIP340(Secp256k1, signature_, msgHash_, publicKey_);
      },
    },
  },
});

console.time('bip340 verify (constant)');
program.rawMethods.verifyBIP340();
console.timeEnd('bip340 verify (constant)');

console.time('bip340 verify (witness gen / check)');
await Provable.runAndCheck(program.rawMethods.verifyBIP340);
console.timeEnd('bip340 verify (witness gen / check)');

console.time('bip340 verify (build constraint system)');
let cs = (await program.analyzeMethods()).verifyBIP340;
console.timeEnd('bip340 verify (build constraint system)');

console.log(cs.summary());

console.time('bip340 verify (compile)');
await program.compile();
console.timeEnd('bip340 verify (compile)');

console.time('bip340 verify (prove)');
let proof = await program.verifyBIP340();
console.timeEnd('bip340 verify (prove)');

console.log('proof.publicOutput', proof.publicOutput.toString());

const proofVerify = await program.verify(proof);
console.log('proofVerify', proofVerify);

proof.publicOutput.assertTrue('signature invalid');
