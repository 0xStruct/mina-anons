# Mina Anons - lab

Lab is a playground where small legos for BIG ideas are built and tested.

This development process is to make iterative followable progress while exploring the less explored territory of `Mina x Ethereum` and `Mina x Bitcoin` as inspired by Mina's ECDSA support.

These smaller legos will then be utilized later to create full-stack ZkApps.

## Demo video

To illustrate running of `.test.ts` and `.run.ts` files
[to be added later]

## Below are a few experiements

**use node version 18**

### Proof of ownership by verifying signature

very first simple program to verify signature
`verifySignedHash` is used instead to abstract out quirks with message prefix 

```sh
npm install
npm run build
node build/src/ownership.run.js
```

### Proof of membership

as part of Mina-anons, users need to anonymously prove membership of certain groups

MerkleTree with persistence (levelDB) is utilized (ref: https://github.com/plus3-labs/o1js-merkle)

`db` folder contains levelDB files for persistence, Merkle Tree is loaded from the existing DB if it is there already
otherwise, a fresh DB is initiated

```sh
npm install
npm run build
node build/src/membership.run.js
```

### Proof of ownership + membership

To prove anonymously that a user not only own an ethereum address but also the address is a member of a list of addresses

Ethereum `address` is not the `publicKey` but is the last 20 characters of Keccak hash of the `publicKey`

`publicKey` can be derived only from the `privateKey` or from the `signature`

Mina ECDSA support verifies only `signature` with `publicKey`
it is needed more to check that `address` can indeed be derived from `pulicKey`

following checks are done
- ethereum `address` is a member
- derived `address` from `publicKey` (in bytes) is equal to the ethereum `address`
- verify `publicKey` (in ForeignCurve) and `signature`
- check `publicKey` (in bytes) vs `publicKey` (in ForeignCurve)

```sh
npm install
npm run build
node build/src/ownership-membership.run.js
```

**test file** `ownership-membership.test.ts` is available now, testing 3 test cases

```sh
npm install
npm run build
npm run test
```

## References and tools
- https://toolkit.abdk.consulting/ethereum#recover-address,key-to-address
- https://sigtool.ambire.com/
- https://www.ethtools.online/eth-pub-to-addr
- https://www.rfctools.com/ethereum-address-test-tool/

- https://docs.minaprotocol.com/zkapps/o1js/ecdsa
- https://wiki.hyperledger.org/display/BESU/SECP256R1+Support
- https://docs.metamask.io/wallet/how-to/sign-data/#use-personal_sign
- https://learnmeabitcoin.com/technical/keys/public-key/

## License

[Apache-2.0](LICENSE)
