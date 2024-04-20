import { ZkProgram, Crypto, createEcdsa, createForeignCurve, Bool, PublicKey, Signature, Field, Poseidon, Keccak, Bytes, Provable } from 'o1js';

export { snapshotVoteProofProgram, Bytes64, Secp256k1, Ecdsa, Scalar };

class Bytes64 extends Bytes(64) {}

class Secp256k1 extends createForeignCurve(Crypto.CurveParams.Secp256k1) {}
class Scalar extends Secp256k1.Scalar {}
class Ecdsa extends createEcdsa(Secp256k1) {}

const snapshotVoteProofProgram = ZkProgram({
  name: 'snapshot-vote-proof',
  // publicInput: Scalar.provable,
  publicOutput: Bool,

  methods: {
    verify: {
      privateInputs: [
        Scalar.provable,
        Field,
        Ecdsa.provable,
        Secp256k1.provable,
        Bytes64.provable,
        Signature,
        Field
      ],
      method(
        messageHashScalar: Scalar,
        messageHashHash: Field,
        signature: Ecdsa,
        publicKey: Secp256k1,
        bytesOfXY: Bytes64,
        oracle_signature: Signature,
        slip_id: Field
      ): Bool {
        const oracle_publicKey = PublicKey.fromBase58("B62qpjadaypxXev6SUbYZboJAZdu3dYEbTm9geYM2XciYXGx3ZqpFGt");
        
        // Verify Oracle Signature
        const validOracleSignature = oracle_signature.verify(oracle_publicKey, [
          slip_id
        ]);
        validOracleSignature.assertTrue();

        const ethAddressFields = Keccak.ethereum(bytesOfXY)
          .toFields()
          .slice(12); // take only the last 20

        // check that slip_id is derived from ethAddress
        Provable.log(slip_id, Poseidon.hash([Poseidon.hash(ethAddressFields), Field('344252421314465354353534534242')]));
        slip_id.assertEquals(Poseidon.hash([Poseidon.hash(ethAddressFields), Field('344252421314465354353534534242')]));

        // assert to assure messageHashHash is equal to messageHashScalar which is used for verification
        // this is to ensure that message cannot be spoofed along with valid proof
        messageHashHash.assertEquals(Poseidon.hash(messageHashScalar.toFields()));

        // check that bytes of X and Y are equal to those from publicKey.x publicKey.y
        // 32 bytes, 256 bits
        const publicKeyXBits = publicKey.x.toBits();
        const publicKeyYBits = publicKey.y.toBits();

        // do we need to check for all 32 + 32 bytes of X and Y?
        // checking 2 + 2 bytes is sufficient

        // check X's first and last bytes
        Field.fromBits(publicKeyXBits.slice(0, 8)).assertEquals(
          bytesOfXY.bytes[31].value
        );
        Field.fromBits(publicKeyXBits.slice(31 * 8, 32 * 8)).assertEquals(
          bytesOfXY.bytes[0].value
        );

        // check Y's first and last bytes
        Field.fromBits(publicKeyYBits.slice(0, 8)).assertEquals(
          bytesOfXY.bytes[63].value
        );
        Field.fromBits(publicKeyYBits.slice(31 * 8, 32 * 8)).assertEquals(
          bytesOfXY.bytes[32].value
        );

        Provable.log("check publicKey (in bytes) vs publicKey (in curve) done");

        const verifiedOwnership = signature.verifySignedHash(messageHashScalar, publicKey);

        Provable.log("verifiedOwnership", verifiedOwnership);

        return verifiedOwnership;
      },
    },
  },
});
