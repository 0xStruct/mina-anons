import type { NextApiRequest, NextApiResponse } from "next";

import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { finalizeEvent, verifyEvent } from "nostr-tools/pure";
import { Relay } from "nostr-tools/relay";
import { useWebSocketImplementation } from "nostr-tools/relay";

useWebSocketImplementation(require("ws"));

export default async function handler(
  nextRequest: NextApiRequest,
  nextResponse: NextApiResponse
) {
  if (nextRequest.method !== "POST") {
    return nextResponse.status(405).send({ message: `Method Not Allowed` });
  }

  try {
    console.log("nextRequest.body", nextRequest.body);
    const { message, ipfsHash } = nextRequest.body;

    const relay = await Relay.connect("wss://relay.example.com");

    // event kind=1
    let event = finalizeEvent(
      {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: `message: ${message} \nproof: ${ipfsHash}\nvia: mina-anons`,
      },
      hexToBytes(process.env.NOSTR_PRIVATE_KEY!)
    );

    let isGood = verifyEvent(event);

    const receipt = await relay.publish(event);

    relay.close();

    return nextResponse.status(200).send({ message: `Success`, receipt });
  } catch (e) {
    console.log(e);
    return nextResponse.status(500).send({ message: `Erorr: ${e}` });
  }
}
