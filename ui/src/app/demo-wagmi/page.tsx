"use client";

import { useEffect, useState, useRef } from "react";
import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";
import { hashMessage, recoverMessageAddress } from "viem";

function App() {
  const account = useAccount();
  const { connectors, connect, status, error } = useConnect();
  const { disconnect } = useDisconnect();

  const [signature, setSignature] = useState<`0x${string}` | undefined>();
  const [message, setMessage] = useState<string>("hello");
  const [merkle, setMerkle] = useState<any | null>(null);
  const [proof, setProof] = useState<any | null>(null);
  const [pinata, setPinata] = useState<any | null>(null);
  const [recoveredAddress, setRecoveredAddress] = useState("");
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const {
    data: signMessageData,
    error: errorSign,
    isPending,
    signMessage,
    variables,
  } = useSignMessage();

  const proofWorkerRef = useRef<Worker>();

  // initate proofWorker and listen to callback
  useEffect(() => {
    console.log("init");
    proofWorkerRef.current = new Worker(
      new URL("@/workers/proof.worker", import.meta.url)
    );
    proofWorkerRef.current.onmessage = (event: MessageEvent) => {
      console.log("worker:", event.data);

      if (event.data.message === "proof-done") {
        setProof({
          proof: event.data.proof,
          verificationKey: event.data.verificationKey,
        });
        setStep(3); // move to next step
        setIsLoading(false);
      }
    };
    return () => {
      proofWorkerRef.current?.terminate();
    };
  }, []);

  const reset = () => {
    setStep(1);
    setRecoveredAddress("");
  };

  useEffect(() => {
    (async () => {
      if (variables?.message && signMessageData) {
        const recoveredAddress = await recoverMessageAddress({
          message: variables?.message,
          signature: signMessageData,
        });
        setRecoveredAddress(recoveredAddress);
        setStep(2);
      }
    })();
  }, [signMessageData, variables?.message]);

  const doSignMessage = async () => {
    signMessage({ message });

    // generate merkle tree and get merkle proof for the current account
    const response = await fetch(
      `/api/merkle?merkleProofIndex=0&address0=${account?.addresses?.[0]}`
    );
    let res = await response.json();

    setMerkle(res);
    console.log(res);
  };

  /* 
  // proof generation via posting to local API
  // replaced with worker
  const doGenerateProof = async () => {
    setIsLoading(true);

    const postData = {
      messageHashHex: hashMessage(message),
      signatureHex: signMessageData,
      merkleProofJSON: merkle?.merkleProofJSON,
      merkleProofIndex: 0,
    };

    console.log(postData);

    const response = await fetch(`/api/proof`, {
      method: "POST",
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData), // body data type must match "Content-Type" header
    });

    let res = await response.json();
    console.log("/api/proof response", res);

    setIsLoading(false);
    setProof(res);
    setStep(3);
  };
  */

  // instead of posting to local API, do it on UI via worker
  const doGenerateProofViaWorker = async () => {
    setIsLoading(true);

    const messageHashHex = hashMessage(message);
    const signatureHex = signature;
    const merkleProofJSON = merkle?.merkleProofJSON;
    const merkleProofIndex = 0;

    const postData = {
      messageHashHex,
      signatureHex,
      merkleProofJSON,
      merkleProofIndex,
    };

    proofWorkerRef.current?.postMessage(JSON.stringify(postData));

    // these are now done after message === "proof-done" from worker
    // setIsLoading(false);
    // setProof({proof, verificationKey});
    // setStep(3);
  };

  const doPostProof = async () => {
    setIsLoading(true);

    const postData = {
      message: message,
      proof: proof.proof,
      verificationKey: proof.verificationKey,
    };

    // console.log("postData", postData);

    const response = await fetch(`/api/post-to-pinata`, {
      method: "POST",
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData), // body data type must match "Content-Type" header
    });

    let res = await response.json();
    console.log("pinata ipfs response", res);
    setPinata(res);
    setIsLoading(false);

    setStep(4);
  };

  return (
    <div className="container max-w-4xl mx-auto">
      {account.status === "connected" && (
        <div className="w-full pt-4 pb-2">
          <div className="float-left">
            <div className="chat chat-start">
              <div className="chat-image avatar">
                <div className="w-10 rounded-full ring ring-success ring-offset-base-100 ring-offset-2">
                  <img
                    src={`https://api.dicebear.com/8.x/thumbs/svg?seed=${account?.addresses[0]}`}
                    crossOrigin="anonymous"
                  />
                </div>
              </div>
              <div className="chat-bubble text-xs font-mono">
                <span>
                  {account?.addresses[0]}
                  {"       \u00a0       \u00a0       \u00a0"}
                </span>
              </div>
              <div className="chat-footer opacity-20 text-xs">
                On chainID: {account.chainId}, Status: {status}
              </div>
            </div>
          </div>

          <button
            className="btn btn-secondary float-right"
            onClick={() => {
              disconnect();
              reset();
            }}
          >
            Disconnect Wallet
          </button>
          <div className="clear-right"></div>
        </div>
      )}
      {account.status !== "connected" && (
        <nav className="dropdown dropdown-end dropdown-bottom w-full pt-4 pb-2">
          <button tabIndex={0} className="btn float-right">
            Connect Wallet
          </button>
          <ul
            tabIndex={0}
            className="menu dropdown-content box z-50 w-52 bg-base-300 p-1 shadow"
          >
            {connectors.map((connector) => (
              <li key={connector.uid}>
                <a
                  className=""
                  key={connector.uid}
                  onClick={() => connect({ connector })}
                >
                  {connector.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {error?.message && (
        <div className="alert alert-error text-xs">
          <span>{error?.message}</span>
        </div>
      )}

      <ul className="steps my-8 w-full">
        <li key="1" className={`step ${step > 0 ? "step-secondary" : ""} `}>
          Sign
        </li>
        <li key="2" className={`step ${step > 1 ? "step-secondary" : ""} `}>
          Prove
        </li>
        <li key="3" className={`step ${step > 2 ? "step-secondary" : ""} `}>
          Post
        </li>
      </ul>
      <div className="p-4 grid place-items-center">
        {step === 1 && (
          <>
            <div role="alert" className="alert alert-info text-xs">
              <span>💡 Enter a message to post anonymously and sign it.</span>
            </div>
            <label className="form-control w-8/12">
              <div className="label">
                <span className="label-text">Message</span>
              </div>
              <textarea
                className="textarea textarea-bordered h-24"
                id="message"
                name="message"
                value={message}
                placeholder="hello"
                onChange={(e) => {
                  setMessage(e.target.value);
                }}
              ></textarea>
            </label>
            <button
              className="btn btn-primary btn-wide my-4"
              disabled={isPending || account.status !== "connected"}
              onClick={() => doSignMessage()}
            >
              {isPending ? (
                <>
                  <span className="loading loading-spinner"></span>Signing ...
                </>
              ) : (
                "Sign Message"
              )}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div role="alert" className="alert alert-info text-xs">
              <span>
                ✅ Signature, hence publicKey, is now ready.
                <br />
                ✅ merkleWitness that attests membership of a merkleTree is also
                ready.
                <br />
                💡 Anonymous proof of ownership and membership is ready to be
                generated.
              </span>
            </div>
            <button
              className="btn btn-primary btn-wide my-4"
              onClick={() => doGenerateProofViaWorker()}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner"></span>Proving ...
                </>
              ) : (
                "Generate Proof"
              )}
            </button>
            {isPending && (
              <div role="alert" className="alert alert-info text-xs">
                <span>
                  ⏳ Proving process involves compling of ZkProgram and actual
                  proving
                  <br />
                  ⏱ it takes a couple of minutes
                  <br />
                  🤐 As the whole process is happening on your computer, your
                  privacy is preserved
                </span>
              </div>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <div role="alert" className="alert alert-info text-xs">
              <span>
                ✅ Ownership and membership proof is ready.
                <br />
                💡 Post the proof for archival on IPFS and curation to Twitter
                feed.
              </span>
            </div>
            <button
              className="btn btn-primary btn-wide my-4"
              onClick={() => doPostProof()}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner"></span>Posting ...
                </>
              ) : (
                "Post Proof"
              )}
            </button>
          </>
        )}

        {step === 4 && (
          <>
            <div role="alert" className="alert alert-success text-xs mb-4">
              <span>
                ✅ Proof is posted successfully to decentralized web as JSON on
                IPFS
                <br />✅ It will be curated and posted to X as an anonymous post
                with proof
              </span>
            </div>
            <div role="alert" className="alert alert-success text-xs mb-4">
              <span>
                IPFS Hash:{" "}
                <a
                  href={`https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${pinata.IpfsHash}`}
                  target="_blank"
                >
                  {pinata.IpfsHash}
                </a>
              </span>
            </div>
            <a
              className="btn btn-primary btn-wide mb-4"
              href={`https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${pinata.IpfsHash}`}
              target="_blank"
            >
              View Proof
            </a>
          </>
        )}

        {recoveredAddress && (
          <div className="alert text-xs mt-4">
            <span>
              Recovered Address: {recoveredAddress} <br />
              Signature:{" "}
              {signMessageData?.substring(0, 8) +
                " ... " +
                signMessageData?.substring(124)}
            </span>
          </div>
        )}

        {errorSign && (
          <div className="alert alert-error text-xs mt-4">
            <span>{errorSign.message}</span>
          </div>
        )}

        {step > 1 && merkle && (
          <div className="alert text-xs mt-4">
            <span>
              Merkle Root: {merkle?.merkleProofJSON.root.substring(0, 40)} ...{" "}
              <br />
              Merkle Proof Index: 0
              <br />
              Merkle Proof:{" "}
              {JSON.stringify(merkle?.merkleProofJSON).substring(0, 60)} ...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
