import { Provable, ZkProgram, Bool, Gadgets, Crypto } from 'o1js';

// @ts-ignore
import { Point, Ecdsa } from '../../node_modules/o1js/dist/node/lib/gadgets/elliptic-curve.js';
// import { Point, Ecdsa } from 'o1js'; // if available after patching

import { verifyBIP340 } from './bip340Verify.js';

import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { schnorr, secp256k1 } from '@noble/curves/secp256k1';
import { schnorrGetE } from './schnorrGetE.js';

// const Secp256k1 = createCurveAffine(CurveParams.Secp256k1);
const Secp256k1 = Crypto.createCurve(Crypto.CurveParams.Secp256k1);

let privateKeys = [
  schnorr.utils.randomPrivateKey(),
  schnorr.utils.randomPrivateKey(),
  schnorr.utils.randomPrivateKey(),
];

// publicKeyPoints are lift_x
let publicKeyPoints = [
  Point.from({
    x: secp256k1.ProjectivePoint.fromPrivateKey(privateKeys[0]).px,
    y: schnorr.utils.lift_x(secp256k1.ProjectivePoint.fromPrivateKey(privateKeys[0]).px).py,
  }),
  Point.from({
    x: secp256k1.ProjectivePoint.fromPrivateKey(privateKeys[1]).px,
    y: schnorr.utils.lift_x(secp256k1.ProjectivePoint.fromPrivateKey(privateKeys[1]).px).py,
  }),
  Point.from({
    x: secp256k1.ProjectivePoint.fromPrivateKey(privateKeys[2]).px,
    y: schnorr.utils.lift_x(secp256k1.ProjectivePoint.fromPrivateKey(privateKeys[2]).px).py,
  }),
];

let msg = "243F6A8885A308D313198A2E03707344A4093822299F31D0082EFA98EC4E6C89";
let auxRand = "C87AA53824B4D7AE2EB035A2B5BBBCCC080E76CDC6D1692C4B0B62D798E6D906";
let signatures = [
  Ecdsa.Signature.fromHex('0x'+bytesToHex(schnorr.sign(msg, privateKeys[0], auxRand))),
  Ecdsa.Signature.fromHex('0x'+bytesToHex(schnorr.sign(msg, privateKeys[1], auxRand))),
  Ecdsa.Signature.fromHex('0x'+bytesToHex(schnorr.sign(msg, privateKeys[2], auxRand))),
];

// e = int(hashBIP0340/challenge(bytes(r) || bytes(P) || m)) mod n.
let messageHashes = [
  Gadgets.Field3.from(schnorrGetE(schnorr.sign(msg, privateKeys[0], auxRand), msg, schnorr.getPublicKey(privateKeys[0]))),
  Gadgets.Field3.from(schnorrGetE(schnorr.sign(msg, privateKeys[1], auxRand), msg, schnorr.getPublicKey(privateKeys[1]))),
  Gadgets.Field3.from(schnorrGetE(schnorr.sign(msg, privateKeys[2], auxRand), msg, schnorr.getPublicKey(privateKeys[2]))),
];

let publicKey = publicKeyPoints[2];
let signature = signatures[2];
let msgHash = messageHashes[2]; // pass the hashed message

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
