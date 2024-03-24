"use client";

import { useState, useRef, useEffect, useCallback } from "react";

import {
  hashMessage,
  recoverPublicKey,
  recoverMessageAddress,
  PrivateKeyAccount,
} from "viem";
import { ACCOUNTS } from "@/config";

function App() {
  const [account, setAccount] = useState<PrivateKeyAccount | null>(null);
  const [accountIndex, setAccountIndex] = useState<number | null>(null);
  const [signature, setSignature] = useState<`0x${string}` | undefined>();
  const [message, setMessage] = useState<string>("hello");
  const [merkle, setMerkle] = useState<any | null>(null);
  const [proof, setProof] = useState<any | null>(null);
  const [pinata, setPinata] = useState<any | null>(null);
  const [recoveredAddress, setRecoveredAddress] = useState<
    `0x${string}` | undefined
  >();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const proofWorkerRef = useRef<Worker>();

  // initate proofWorker and listen to callback
  useEffect(() => {
    console.log("init");
    proofWorkerRef.current = new Worker(
      new URL("@/workers/proof.worker", import.meta.url)
    );
    proofWorkerRef.current.onmessage = (event: MessageEvent) => {
      console.log("worker has responded", event.data);
    };
    return () => {
      proofWorkerRef.current?.terminate();
    };
  }, []);

  // const doGenerateProofWithWorker = useCallback(async () => {
  //   // proofWorkerRef.current?.postMessage(100000);
  //   setIsLoading(true);

  //   const messageHashHex = hashMessage(message);
  //   const signatureHex = signature;
  //   const merkleProofJSON = merkle?.merkleProofJSON;
  //   const merkleProofIndex = accountIndex;

  //   proofWorkerRef.current?.postMessage({
  //     messageHashHex,
  //     signatureHex,
  //     merkleProofJSON,
  //     merkleProofIndex,
  //   });
  // }, []);

  const reset = () => {
    setStep(1);
    setMerkle(null);
    setRecoveredAddress(undefined);
    setIsLoading(false);
  };

  const mockConnect = (i: number) => {
    setAccountIndex(i);
    setAccount(ACCOUNTS[i]);
    reset();
  };

  const mockDisconnect = () => {
    setAccountIndex(null);
    setAccount(null);
    reset();
  };

  const doSignMessage = async () => {
    setIsLoading(true);

    let sig = await account?.signMessage({ message });

    setSignature(sig);

    const add = await recoverMessageAddress({
      message: message,
      signature: sig!,
    });

    setRecoveredAddress(account?.address);

    // generate merkle tree and get merkle proof for the current account
    const response = await fetch(
      `/api/merkle?merkleProofIndex=${accountIndex}`
    );
    let res = await response.json();

    setMerkle(res);

    setIsLoading(false);

    setStep(2);
  };

  /* proof generation via posting to local API
  const doGenerateProof = async () => {
    setIsLoading(true);

    const postData = {
      messageHashHex: hashMessage(message),
      signatureHex: signature,
      merkleProofJSON: merkle?.merkleProofJSON,
      merkleProofIndex: accountIndex,
    };

    // post to local API - requiring user to run Next.js app
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
    console.log(res.proof.publicOutput);

    setIsLoading(false);
    setProof(res);

    setStep(3);
  };
  */

  /*
  const loadForProof = async () => {
    const { Field, ZkProgram } = await import("o1js");
  
    // const {
    //   verifyOwnershipMembershipProgram,
    //   MerkleProof,
    //   Secp256k1,
    //   Ecdsa,
    //   Scalar,
    //   Bytes64,
    // } = await import("@/contracts/ownership-membership");

    // const { verifyMembershipProgram } = await import("@/contracts/membership");
  
    return {
      Field,
      ZkProgram,
    };
  };
  */

  // instead of posting to local API, do it on UI via worker
  const doGenerateProofOnUI = async () => {
    setIsLoading(true);

    const messageHashHex = hashMessage(message);
    const signatureHex = signature;
    const merkleProofJSON = merkle?.merkleProofJSON;
    const merkleProofIndex = accountIndex;

    const postData = {
      messageHashHex,
      signatureHex,
      merkleProofJSON,
      merkleProofIndex,
    }

    proofWorkerRef.current?.postMessage(JSON.stringify(postData));

    // try {
    //   const {
    //     Field,
    //     ZkProgram,
    //   } = await loadForProof();

    //   const myProgram = ZkProgram({
    //     name: 'myProgram',
    //     publicOutput: Field,
    //     methods: {
    //       prove: {
    //         privateInputs: [Field],
    //         method(value: any): any {
    //           value.assertEquals(Field(1));
    //           return Field(1);
    //         },
    //       },
    //     },
    //   });

    //   await myProgram.compile();
    // } catch(e) {
    //   console.log("e", e);
    // }

    // these are now done after success message from worker
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
      {account !== null && (
        <div className="w-full pt-4 pb-2">
          <div className="float-left p-0">
            <div className="chat chat-start">
              <div className="chat-image avatar">
                <div className="w-10 rounded-full ring ring-success ring-offset-base-100 ring-offset-2">
                  <img
                    src={`https://api.dicebear.com/8.x/thumbs/svg?seed=${account?.address}`} crossOrigin="anonymous"
                  />
                </div>
              </div>
              <div className="chat-bubble text-sm font-mono">
                <span>
                  {account?.address}
                  {"       \u00a0       \u00a0       \u00a0"}
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
            {ACCOUNTS.map((acc, i) => (
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
                ✅ Signature, hence publicKey, is now ready.
                <br />
                ✅ merkleWitness that attests membership of a merkleTree is also
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
              onClick={() => doGenerateProofOnUI()}
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
                <br />✅ It will be curated and posted to X as an anonymous post
                with proof
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
              {proof.proof.publicOutput[0] === "1" ? "✅" : "🚫"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
