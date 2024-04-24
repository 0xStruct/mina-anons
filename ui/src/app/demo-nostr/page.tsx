"use client";

import { useState, useRef, useEffect, useCallback } from "react";

import { BIP340_ACCOUNTS } from "@/config";

import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { schnorr, secp256k1 } from '@noble/curves/secp256k1';
import { schnorrGetE } from "@/contracts/schnorrGetE";

function App() {
  const [account, setAccount] = useState<any | null>(null);
  const [accountIndex, setAccountIndex] = useState<number | null>(null);
  const [signature, setSignature] = useState<string | undefined>();
  const [message, setMessage] = useState<string>("hello");
  const [merkle, setMerkle] = useState<any | null>(null);
  const [proof, setProof] = useState<any | null>(null);
  const [pinata, setPinata] = useState<any | null>(null);
  const [recoveredAddress, setRecoveredAddress] = useState<string | undefined>();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [workerMessage, setWorkerMessage] = useState<string>("");

  const proofWorkerRef = useRef<Worker>();

  // initate proofWorker and listen to callback
  useEffect(() => {
    console.log("init");
    proofWorkerRef.current = new Worker(
      new URL("@/workers/bip340.proof.worker", import.meta.url)
    );
    proofWorkerRef.current.onmessage = (event: MessageEvent) => {
      console.log("worker:", event.data);
      setWorkerMessage(event.data?.message);

      if (event.data.message === "proof-done") {
        console.log(event.data.proof);
        console.log(event.data.verificationKey);
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

  // const doGenerateProofWithWorkerCallback = useCallback(async () => {
  //   // proofWorkerRef.current?.postMessage(100000);
  //   setIsLoading(true);
  // }, []);

  const reset = () => {
    setStep(1);
    setMerkle(null);
    setRecoveredAddress(undefined);
    setIsLoading(false);
  };

  const mockConnect = (i: number) => {
    setAccountIndex(i);
    setAccount(BIP340_ACCOUNTS[i]);
    reset();
  };

  const mockDisconnect = () => {
    setAccountIndex(null);
    setAccount(null);
    reset();
  };

  const doSignMessage = async () => {
    setIsLoading(true);

    let sig = schnorr.sign(new TextEncoder().encode(message), hexToBytes(account?.privateKeyHex));

    setSignature(bytesToHex(sig));

    setRecoveredAddress(account?.address);

    // generate merkle tree and get merkle proof for the current account
    const response = await fetch(
      `/api/merkle-bip340?merkleProofIndex=${accountIndex}`
    );
    let res = await response.json();

    setMerkle(res);

    setIsLoading(false);

    setStep(2);
  };

  // instead of posting to local API, do it on UI via worker
  const doGenerateProofViaWorker = async () => {
    setIsLoading(true);

    const messageHash = schnorrGetE(hexToBytes(signature!), new TextEncoder().encode(message), account?.publicKeyHex).toString();
    const signatureHex = signature;
    const publicKeyPoint = {x: account?.publicKeyPoint.px.toString(), y: account?.publicKeyPoint.py.toString() };
    const merkleProofJSON = merkle?.merkleProofJSON;
    const merkleProofIndex = accountIndex;

    const postData = {
      messageHash,
      signatureHex,
      publicKeyPoint,
      merkleProofJSON,
      merkleProofIndex,
    };

    // console.log("postData", postData)

    proofWorkerRef.current?.postMessage(JSON.stringify(postData));

    // these are now done after message === "proof-done" from worker
    // setIsLoading(false);
    // setProof({proof, verificationKey});
    // setStep(3);
  };

  const doPostProof = async () => {
    setIsLoading(true);

    // console.log("proof", proof);

    const postData = {
      message: message,
      proof: proof.proof,
      verificationKey: { data: proof.verificationKey.data, hash: String(proof.verificationKey.hash.value[1][1]) }
    };

    console.log("postData", postData);

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
      {account !== null && (
        <div className="w-full pt-4 pb-2">
          <div className="float-left p-0">
            <div className="chat chat-start">
              <div className="chat-image avatar">
                <div className="w-10 rounded-full ring ring-success ring-offset-base-100 ring-offset-2">
                  <img
                    src={`https://api.dicebear.com/8.x/thumbs/svg?seed=${account?.address}`}
                    crossOrigin="anonymous"
                  />
                </div>
              </div>
              <div className="chat-bubble text-sm font-mono">
                <span>
                  {account?.address}
                  {"       \u00a0       \u00a0       \u00a0       \u00a0"}
                </span>
              </div>
              <div className="chat-footer opacity-30 text-xs">
                Mock wallet of Index #{accountIndex}
              </div>
            </div>
          </div>
          <button
            className="btn btn-secondary float-right"
            onClick={() => {
              mockDisconnect();
              reset();
            }}
          >
            Disconnect Wallet
          </button>
          <div className="clear-right"></div>
        </div>
      )}
      {account === null && (
        <nav className="dropdown dropdown-end dropdown-bottom w-full pt-4 pb-2">
          <button tabIndex={0} className="btn float-right">
            Connect Wallet
          </button>
          <ul
            tabIndex={0}
            className="menu dropdown-content box z-50 w-52 bg-base-300 p-1 shadow"
          >
            {BIP340_ACCOUNTS.map((acc, i) => (
              <li key={i}>
                <a className="font-mono" key={i} onClick={() => mockConnect(i)}>
                  {acc.address.substring(0, 16)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
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

      <div className="w-full grid place-items-center">
        <div className="text-2xl">Mina 🤝 Bitcoin BIP340</div>
        <div className="text-xs text-blue-200 italic mt-1">Private proofs for Bitcoin/Nostr accounts</div>
      </div>

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
              onClick={() => doSignMessage()}
              disabled={account === null || message.length === 0 || isLoading}
            >
              {isLoading ? (
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
            <div role="alert" className="alert alert-info text-xs mb-4">
              <span>
                ✅ Signature (Schnorr) is now ready.
                <br />
                ✅ For demo purpose, all 5 mock addresses are put in the merkleTree
                <br />
                ✅ merkleWitness that attests membership of the merkleTree is also
                ready.
                <br />
                💡 Anonymous proof of ownership and membership is ready to be
                generated.
              </span>
            </div>
            {isLoading && (
              <div role="alert" className="alert alert-info text-xs mb-4">
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
                <br />
                ✅ It will be posted to Nostr as an anonymous post with proof
              </span>
            </div>
            <div role="alert" className="alert alert-success text-xs mb-4">
              <span>
                ✅ IPFS Hash:{" "}
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

        {step === 2 && isLoading && (
          <div className="alert text-xs mt-4">
            <span>Worker: {workerMessage}</span>
          </div>
        )}

        {recoveredAddress && (
          <div className="alert text-xs mt-4">
            <span>
              Recovered Address: {recoveredAddress} <br />
              Signature:{" "}
              {signature?.substring(0, 10) +
                " ... " +
                signature?.substring(122)}
            </span>
          </div>
        )}

        {step > 1 && merkle && (
          <div className="alert text-xs mt-4">
            <span>
              Merkle Root: {merkle?.merkleProofJSON.root.substring(0, 40)}{" "}
              <br />
              Merkle Proof Index: {accountIndex}
              <br />
              Merkle Proof:{" "}
              {JSON.stringify(merkle?.merkleProofJSON).substring(0, 60)} ...
            </span>
          </div>
        )}

        {step > 2 && proof && (
          <div className="alert text-xs mt-4">
            <span>
              Ownership verified:{" "}
              {proof.proof.publicOutput[0] === "1" ? "✅" : "🚫"}
              <br />
              Membership verified:{" "}
              {proof.proof.publicOutput[1] === "1" ? "✅" : "🚫"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
