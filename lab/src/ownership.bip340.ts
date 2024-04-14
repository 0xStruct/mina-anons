import { ZkProgram, Bool, Gadgets, Crypto } from 'o1js';
// @ts-ignore
import { Point, Ecdsa } from '../../node_modules/o1js/dist/node/lib/gadgets/elliptic-curve.js';
// import { Point, Ecdsa } from 'o1js'; // if available after patching

import { verifyBIP340 } from './bip340Verify.js';

export { verifyBIP340OwnershipProgram };

const Secp256k1 = Crypto.createCurve(Crypto.CurveParams.Secp256k1);

const verifyBIP340OwnershipProgram = ZkProgram({
  name: 'verifyBIP340Ownership',
  publicInput: Gadgets.Field3.provable,
  publicOutput: Bool,
  methods: {
    verifyBIP340: {
      privateInputs: [Ecdsa.Signature.provable, Point.provable],
      method(
        msgHash: Gadgets.Field3,
        signature: { r: Gadgets.Field3; s: Gadgets.Field3 },
        publicKey: Point
      ) {
        return verifyBIP340(Secp256k1, signature, msgHash, publicKey);
      },
    },
  },
});
