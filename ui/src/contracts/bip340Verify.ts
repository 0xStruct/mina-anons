import { Bool, Provable, Gadgets, Crypto } from 'o1js';

import { EllipticCurve, Point, Ecdsa } from 'o1js'; // if available after patching

export { verifyBIP340 };

type point = { x: bigint; y: bigint };
type CurveAffine = ReturnType<typeof Crypto.createCurve>;

function verifyBIP340(
  Curve: CurveAffine,
  signature: { r: Gadgets.Field3; s: Gadgets.Field3 },
  msgHash: Gadgets.Field3,
  publicKey: Point,
  config: {
    G?: { windowSize: number; multiples?: Point[] };
    P?: { windowSize: number; multiples?: Point[] };
    ia?: point;
  } = { G: { windowSize: 4 }, P: { windowSize: 4 } }
): Bool {
  // constant case
  if (
    Ecdsa.Signature.isConstant(signature) &&
    Gadgets.Field3.isConstant(msgHash) &&
    Point.isConstant(publicKey)
  ) {
    console.log('verifyBIP340 constant ###');
    // throw new Error('verifyBIP340 constant not implemented yet');
  }

  let { r, s } = signature;
  let G = Point.from(Curve.one);

  let sG = EllipticCurve.scale(s, G, Curve); // s x G

  // e = int(hashBIP0340/challenge(bytes(r) || bytes(P) || m)) mod n.
  let e = msgHash; // passing in already hashed messaged

  // P passed should be already lift_x
  let eP = EllipticCurve.scale(e, publicKey, Curve); // e x P

  let R = EllipticCurve.add(sG, EllipticCurve.negate(eP, Curve), Curve); // R = s x G - e x P

  // https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki#user-content-Verification
  // Fail if is_infinite(R) or not has_even_y(R) or x(R) ≠ r.

  // reduce R.x modulo the curve order
  let Rx = Gadgets.ForeignField.mul(R.x, Gadgets.Field3.from(1n), Curve.order);

  // we have to prove that Rx is canonical, because we check signature validity based on whether Rx _exactly_ equals the input r.
  // if we allowed non-canonical Rx, the prover could make verify() return false on a valid signature, by adding a multiple of `Curve.order` to Rx.
  Gadgets.ForeignField.assertLessThan(Rx, Curve.order);

  // Fail if not has_even_y(R)
  const isEven = new Bool(false);

  Provable.log('Rx vs r', Rx, r);

  // ref: lib/signature.ts
  // return Bool.and(r.x.equals(this.r), r.y.toBits()[0].equals(false));

  // x(R) === r AND R.y is even
  return Bool.and(
    Provable.equal(Gadgets.Field3.provable, Rx, r),
    Provable.equal(Bool, isEven, new Bool(R.y[0].toBits()[0]))
  );
}
