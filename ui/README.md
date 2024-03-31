# Mina Anons - UI

UI is built with Next.js, DaisyUI and WAGMI. Pinata is used for IPFS pinning.

UI/UX is given extra care to make Mina ZK tech accessible for users.

## About app structure and how to run

first `cp .env.local.example .env.local`
and enter Pinata JWT and Gateway

```shell
# use node version 18
nvm use 18

npm install

npm run dev
```

`src/app/` contains pages or screens explained below
`src/contracts/` contains ZkProgram code, mainly to verify ownership + membership anonymously
`pages/api/` contains API endpoints used by pages

## Below are app pages

- home page `/`

🎥: https://youtu.be/xOmbYQm6URs

to explain and convey effectively about the project

- demo page `/demo`

🎥: https://youtu.be/jGe26i2kJuU

this demo is preloaded with 5 wallets to test with
the demo guides user through 3 steps (sign, prove, post)

- demo w/ WAGMI page `/demo-wagmi`

🎥: https://youtu.be/5Be_A7OnZi0

this demo connects with user's wallet (via WAGMI)
the demo guides user through 3 steps (sign, prove, post)

- curate page `/curate`

🎥: https://youtu.be/Nsl6ym2ZawQ

this page is for admin to load proof JSON from IPFS/Pinata
the proof is verified, and it prepares necessary info to be posted to X

Sample X/tweet: https://bit.ly/mina-anons-x

- club page `/club/mambo-5`

🎥: https://youtu.be/YsZkgOV2w0k

this page is for admin to manage members in a club
any club can be managed... i.e: `/club/apes-hodlers`, `/club/nouns`
club members are kept in Merkle Tree, which is persisted on levelDB

levelDBes are stored as `dbs/mambo-5/`, `dbs/apes-hodlers`, `dbs/nouns` etc

## Below are API endpoints

- `pages/api/club`

for club management

- `pages/api/merkle`

for supporting `/demo` and `/demo-wagmi` pages' Step #2

- `pages/api/post-to-pinata`

to post proof JSON to Pinata for IPFS pinning

Sample proof: [IPFS pinned on Pinata](https://apricot-odd-wallaby-508.mypinata.cloud/ipfs/bafkreigpehz6ozqdgnhc74a32yhjzd73356zbcd6wefpzmcmd4sjm3nsim)

- `pages/api/proof`

for generating proof for ownership + membership

this is to be run by users themselves to assure that no private info is leaked to cloud servers