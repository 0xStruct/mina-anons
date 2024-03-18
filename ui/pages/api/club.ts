import type { NextApiRequest, NextApiResponse } from "next";
import { MerkleTree } from "@/contracts/lib/merkle/merkle_tree";

import { Bytes, Field, Poseidon } from "o1js";

import { Level } from "level";
import { LevelStore } from "@/contracts/lib/store/level_store";

import fs from 'fs';

type ResponseData = {
  message: string;
};

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  if (request.method !== "POST") {
    return response.status(405).send({ message: `Method Not Allowed` });
  }

  const { action, clubId, rows, merkleProofIndex } = request.body;
  console.log(action, clubId);

  // off-chain persistence with levelDB
  const levelDb = new Level<string, any>(`./dbs/${clubId}`);
  let store: LevelStore<Field> = new LevelStore<Field>(levelDb, Field, "club");

  let tree: MerkleTree<Field>;

  if (action === "initiate") {
    try {
      // load from level store
      console.log("loading from off-chain storage levelDB ...");
      tree = await MerkleTree.import<Field>(store, 8, Field);

      // let leaves = await store.getValuesMap();
      // let members = Array.from(leaves).map(a => a[1].toString());

      // load rows from rows.txt
      let rows;
      try {
        rows = fs.readFileSync(`./dbs/${clubId}/rows.txt`, 'utf8');
        // console.log("rows", rows);
      } catch (err) {
        console.error(err);
      }

      await levelDb.close();

      return response.status(200).send({
        message: `success`,
        merkleRoot: tree.getRoot().toString(),
        rows,
      });
    } catch (e) {
      await levelDb.close();

      return response.status(200).send({
        message: `nothing to load yet`,
      });
    }
  }

  if (action === "update") {
    await levelDb.open();
    let addresses: string[] = rows.split(/\r?\n/);

    let leaves: { index: bigint; value?: Field | undefined }[] = addresses.map(
      (add, index) => {
        return {
          index: BigInt(index),
          value: Poseidon.hash(
            Bytes.fromHex(add.trim().substring(2)).toFields()
          ),
        };
      }
    );
    console.log("leaves", leaves);

    tree = await MerkleTree.build<Field>(store, 8, Field); // build a new merkle tree

    for (let i = 0; i < leaves.length; i++) {
      await tree.update(leaves[i].index, leaves[i].value);
    }

    // save rows to rows.txt
    try {
      fs.writeFileSync(`./dbs/${clubId}/rows.txt`, rows);
      // file written successfully
    } catch (err) {
      console.error(err);
    }

    await levelDb.close(); // close before ending the process

    console.log("root", tree.getRoot().toString());

    return response.status(200).send({
      message: `success`,
      merkleRoot: tree.getRoot().toString(),
      count: addresses.length,
    });
  }

  if (action === "getProof") {
    try {
      // load from level store
      console.log("loading from off-chain storage levelDB ...");
      tree = await MerkleTree.import<Field>(store, 8, Field);

      let merkleProof = await tree.prove(BigInt(String(merkleProofIndex)));
      let merkleProofJSON = merkleProof.toJSON();

      await levelDb.close();

      return response.status(200).send({
        message: `success`,
        merkleRoot: tree.getRoot().toString(),
        merkleProofIndex,
        merkleProofJSON,
      });
    } catch (e) {
      console.log(e);
      await levelDb.close();

      return response.status(200).send({
        message: `fail: no club yet, create a club first`,
      });
    }
  }

  return response.status(200).send({ mesage: `empty` });
}
