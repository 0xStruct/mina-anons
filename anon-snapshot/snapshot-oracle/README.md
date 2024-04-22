# VP Oracle

Oracle to certify voting power of voters for Snapshot

It uses [Snapshot.js SDK](https://docs.snapshot.org/tools/snapshot.js) to get
voting power and certify by signing it.

This signed output can then be verified and used anonymously in ZkProgram as a private input.

First setup, `.env.local` by `cp .env.local.example .env.local`

- `PRIVATE_KEY` for the oracle to join with
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

[GET] `/vp?address=[address]&space=[space]&snapshot=[snapshot]`

i.e: `/vp?address=0xa478c2975ab1ea89e8196811f51a7b7ade33eb11&space=yam.eth&snapshot=11437846`

[GET] `/scores?addresses=[address1,address2,address3]&space=[space]&snapshot=[snapshot]`

i.e: `/scores?addresses=[0xa478c2975ab1ea89e8196811f51a7b7ade33eb11,0xeF8305E140ac520225DAf050e2f71d5fBcC543e7,0x1E1A51E25f2816335cA436D65e9Af7694BE232ad]&space=yam.eth&snapshot=11437846`