"use client";

import { useState } from "react";

function App() {
  const [ipfsHash, setIpfsHash] = useState<string>(
    "bafkreigpehz6ozqdgnhc74a32yhjzd73356zbcd6wefpzmcmd4sjm3nsim"
  );
  const [message, setMessage] = useState<string>("");
  const [proofIpfs, setProofIpfs] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProofIpfs = async () => {
    setIsLoading(true);

    // generate merkle tree and get merkle proof for the current account
    const response = await fetch(
      `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${ipfsHash}`
    );
    let res = await response.json();

    console.log(res);
    setProofIpfs(res);
    setMessage(res.message);

    await doProofVerification(res);

    setIsLoading(false);
  };

  const doProofVerification = async (proof: any) => {
    const response = await fetch(`/api/proof-verify`, {
      method: "POST",
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(proof), // body data type must match "Content-Type" header
    });

    let res = await response.json();
    console.log("/api/proof-verify response", res);
  };

  return (
    <div className="container max-w-4xl mx-auto">
      <div className="mb-16">

      </div>
      <div className="w-full p-4 grid place-items-center">
        <>
          <div role="alert" className="alert alert-info text-xs mb-4">
            <span>
              💡 Enter IPFS Hash from Pinata to post the anonymous post to X.
            </span>
          </div>
          <label className="form-control w-8/12">
            <div className="label">
              <span className="label-text">IPFS Hash (pinned on Pinata)</span>
            </div>
            <div className="flex flex-row">
              <input
                type="text"
                placeholder="IPFS Hash"
                value={ipfsHash}
                onChange={(e) => {
                  setIpfsHash(e.target.value);
                }}
                className={`input input-bordered w-10/12 text-xs font-mono ${ipfsHash.startsWith("baf") ? "" : "input-error"} ${proofIpfs ? "input-success" : ""}`}
              />
              <button
                className="btn w-2/12 ml-2"
                onClick={() => fetchProofIpfs()}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner"></span>
                  </>
                ) : (
                  "Fetch"
                )}
              </button>
            </div>
          </label>
          <label className="form-control w-8/12">
            <div className="label">
              <span className="label-text">Message</span>
            </div>
            <textarea
              className={`textarea textarea-bordered h-24 ${message !== "" ? "textarea-success" : ""}`}
              id="message"
              name="message"
              defaultValue={message}
              placeholder="message to be loaded from proof IPFS"
              contentEditable="false"
            ></textarea>
          </label>
          <a
            className={`btn btn-wide bg-black my-4 ${message === "" || isLoading ? "btn-disabled" : ""}`}
            target="_blank"
            href={`https://twitter.com/intent/tweet?text=${message}%0A%0A[Proof IPFS Hash:%20${ipfsHash}]&url=https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${ipfsHash}&via=mina_anons`}
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner"></span>
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                Curate To X
              </>
            )}
          </a>
        </>

        {proofIpfs && isLoading && (
          <div className="alert text-xs mt-4">
            <span>
              Verifying JSON proof ...
            </span>
          </div>
        )}

        {proofIpfs && !isLoading && (
          <div className="alert text-xs mt-4">
            <span>
              Verification done!
            </span>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
