# Mina-anons: 🕶⚡ Anon Snapshot
Anon Snapshot brings privacy-preserving voting into `Snapshot.org` powered by Mina Zero Knowledge

Snapshot is a widely popular voting platform for DAOs with millions of DAO members. It is used by Aave, ENS, ApeCoin, Starknet, Lido, Safe etc

With this project, the objective is to showcase how Mina could integrate into existing platforms seamlessly.

## Motivation
It starts with the questions: **how might we onboard massive amounts of users to Mina and introduce Mina's powerful ZK technologies?**

Hence, research was done to identify a big platform with high activities and an actual need for privacy preserving features.

As Snapshot has reach of millions DAO members through DAOs on its platform. Moreover,  the nature of voting has continuous user activities.

## Why ZK voting
- Overcoming groupthink / compliance
	- Imagine an influencer (i.e Vitalik Buterin) swaying votes
	- Voting is to encourage everyone to voice out without fear of repercussions for their choices
- Overcoming cancel culture
	- Just because a person voted for something, without ZK the person could be canceled for his/her decision

## Study of codebase
Snapshot's codebase was studied for integration feasibility and potential entry points.

Relevant repositories are:
- [frontend UI](https://github.com/snapshot-labs/snapshot)
	- A VueJS frontend app
	- 💡 integrate in-app as component(s)
- [Snapshot.js](https://github.com/snapshot-labs/snapshot.js)
	- JS SDK with [great docs](https://docs.snapshot.org/tools/snapshot.js)
	- `getScores` and `getVP` get voting power according to voting strategies
	- `validate` validation of an address according to validation strategies
	- 💡integrate out-app by calling APIs
- [Sequencer](https://github.com/snapshot-labs/snapshot-sequencer)
		- An ExpressJS server
		- It has `ingestor.ts` that takes in votes
		- 💡key for taking in ZK vote proofs
- [Snapshot Hub](https://github.com/snapshot-labs/snapshot-hub)
		- a graphql API
		- 💡to understand its data structure

### Integration paths
2 paths are possible
- in-app path
	- pros: native exposure to all existing users
	- cons: limitation to components, subject to Snapshot team's approval
- out-app path
	- pros: more flexibility
	- cons: DAOs would need their own setups, still need support from Snapshot team

I decided to go with the in-app path due to exposure. During initial development, I will be running my own custom instance. Only then I will initiate a possibly long journey of getting my work accepted and deployed by Snapshot team.

_This is subjected to change as I am getting the first MVP working in a month_

### Action plan
- get `scores` or `voting power` verified through Mina **Zk Oracle**
	- this is to be used for preparing vote proof
- **ZkProgram** for `vote proof` which accepts `signature`, `vote`, verified `voting power`, `proposal`
- Tweak `ingestor` to accept `vote proof` which only displays `vote` but with no `voter` identity but ascertains that `voter` is eligible for voting
- UI integrations
	- Tweak `votes list` component
	- UI for generating `vote proof`

### Current implementation explained

- `slip_id` is a unique "anonymous" identifier for a voter issued by `snapshot-oracle`
- from `/demo-snapshot` UI screen, snapshot vote proof can be generated through `snapshotVoteProof.ts` ZK Program.
- the snapshot vote proof is archived on IPFS, a _vote by proxy_ with reference to the vote proof is signed and submitted by `snapshot-oracle`
- 2 voting strategies, currently considered for, are `whitelist` and `ticket`

```javascript
	// account here is the account of the oracle
	const receipt = await client.vote(web3, account, {
		space: 'mina-anons.eth',
		proposal: '0xfc255b04d5a5e9d39b8aa63694ccd20eed46eec651ae5c2332397f646312db5a',
		type: 'single-choice',
		choice: 1,
		reason: 'Choice 1 make lot of sense',
		app: 'mina-anons',
		slip_id: '<slip_id>',
		proof: '<proof_ipfs_cid>'
	});
```

- the tweaked [`snapshot-sequencer`](snapshot-sequencer) can ingest the _vote by proxy_ and upon `verifying` and `saving`, voter's `slip_id` is used as a unique identifier