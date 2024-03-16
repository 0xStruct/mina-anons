import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  nextRequest: NextApiRequest,
  nextResponse: NextApiResponse
) {
  if (nextRequest.method !== "POST") {
    return nextResponse.status(405).send({ message: `Method Not Allowed` });
  }

  try {
    console.log("nextRequest.body", nextRequest.body);
    
    const options = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
        "Content-Type": "application/json",
      },
      body: `{"pinataContent":${JSON.stringify(nextRequest.body)},"pinataMetadata":{"name":"mina-anons.json", "keyvalues":{"merkleRoot": ""}},"pinataOptions":{"cidVersion":1}}`,
    };

    //   fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', options)
    //     .then(response => response.json())
    //     .then(response => console.log(response))
    //     .catch(err => console.error(err));

    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      options
    );
    const res = await response.json();

    return nextResponse.status(200).send(res);
  } catch (e) {
    console.log(e);
    return nextResponse.status(500).send({ message: `Erorr: ${e}` });
  }
}
