# Mina Anons - lab

Lab is a playground where smaller legos for BIG ideas are built and tested.

This development process is make iterative followable progress while exploring the less explored territory of "Mina x Ethereum" and "Mina x Bitcoin" as inspired by Mina's ECDSA support.

These smaller legos will then be utilized later in create full-stack ZkApps.

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
