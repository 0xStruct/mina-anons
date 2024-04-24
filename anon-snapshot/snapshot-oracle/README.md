# VP Oracle

Oracle to certify voting power of voters for Snapshot

It uses [Snapshot.js SDK](https://docs.snapshot.org/tools/snapshot.js) to get
voting power and certify by signing it.

This signed output can then be verified and used anonymously in ZkProgram as a private input.

First setup, `.env.local` by `cp .env.local.example .env.local`

- `ORACLE_PRIVATE_KEY` for the oracle to sign
- `ORACLE_SECRET` numberical string used for generating `slip_id` hash
- `SNAPSHOT_API_KEY` an optional API key for higher rate limits

```shell
npm install

npm run start

# or
npm run start:prod

# or
npm run start:nodemon
```

## API Endpoints

[GET] `/slip?space=[space]&proposal=[proposalHex]&signature=[signatureHex]

i.e: `/slip?space=mina-anons.eth&proposal=0xdc255b04d5a5e9d39b8aa63694ccd20eed46eec651ae5c2332397f646312db5a&signature=0xa08344ebff0ab8ec7137f51b8d900060bbc17845ebff780a01f0e54cbe01309f3196f6797b96611eeeb328e4849bf347170248df2b24f4ebd12be6f4e3c8be3b1c`

[GET] `/vp?address=[address]&space=[space]&snapshot=[snapshot]`

i.e: `/vp?address=0xa478c2975ab1ea89e8196811f51a7b7ade33eb11&space=yam.eth&snapshot=11437846`

[GET] `/scores?addresses=[address1,address2,address3]&space=[space]&snapshot=[snapshot]`

i.e: `/scores?addresses=[0xa478c2975ab1ea89e8196811f51a7b7ade33eb11,0xeF8305E140ac520225DAf050e2f71d5fBcC543e7,0x1E1A51E25f2816335cA436D65e9Af7694BE232ad]&space=yam.eth&snapshot=11437846`