# Mina-anons: UI or 🎊 CLUB

UI is built with Next.js, DaisyUI and WAGMI. Pinata is used for IPFS pinning.

UI/UX is given extra care to make Mina ZK tech accessible for users.

## About app structure and how to run

first `cp .env.local.example .env.local`

then update `PINATA_JWT`, `NEXT_PUBLIC_GATEWAY_URL`, `ORACLE_PRIVATE_KEY` and `ORACLE_SECRET`

```shell
# use node version 18
nvm use 18

npm install

npm run dev
```

- `src/app/` contains pages or screens explained below
- `src/contracts/` contains ZkProgram code, mainly to verify ownership + membership anonymously
- `pages/api/` contains API endpoints used by pages
- `workers/` contains web workers mainly to load `o1js` related jobs smoothly on client

## Below are app pages

### home page `/`

🎥: https://youtu.be/xOmbYQm6URs

to explain and convey effectively about the project

### demo page `/demo`

🎥: https://youtu.be/jGe26i2kJuU

this demo is preloaded with 5 ethereum wallets to test with,
and guides user through 3 steps (sign, prove, post)

_to eventually post anonymously to Twitter/X_

### demo w/ WAGMI page `/demo-wagmi`

🎥: https://youtu.be/5Be_A7OnZi0

this demo connects with user's wallet (via WAGMI),
and guides user through 3 steps (sign, prove, post)

_to eventually post anonymously to Twitter/X_

### demo BIP340/Nostr page `/demo-nostr`

🎥: https://youtu.be/rS4H_iSFqWU

this demo is preloaded with 5 bitcoin wallets to test with,
and guides user through 3 steps (sign, prove, post)

_to eventually post anonymously to Nostr_

### demo Snapshot.org page `/demo-snapshot`

🎥: https://youtu.be/nFIGTrRz-o4

this demo is preloaded with 5 ethereum wallets to test with,
and guides user through 3 steps (sign, prove, post)

_vote proof is then ingested privately by snapshot-sequencer_

### curate page `/curate`

🎥: https://youtu.be/Nsl6ym2ZawQ

this page is for admin to load proof JSON from IPFS/Pinata
the proof is verified, and it prepares necessary info to be posted to X

Sample X/tweet: https://bit.ly/mina-anons-x

### club page `/club/mambo-5`

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

- `pages/api/proof` [deprecated, in favor of web worker]

~~for generating proof for ownership + membership~~

~~this is to be run by users themselves to assure that no private info is leaked to cloud servers~~

- `pages/api/post-to-nostr`

to post an anonymous post to Nostr

- `pages/api/slip`

to get unique identifier to mask a voter address

## Below are workers

- `src/workers/proof.worker.ts`

for generating proof for ownership + membership (ethereum ECDSA)

- `src/workers/bip340.proof.worker.ts`

for generating proof for ownership + membership (bitcoin BIP340)

- `src/workers/snapshotVoteProof.worker.ts`

for generating proof for _vote by proxy_ to snapshot.org for private voting