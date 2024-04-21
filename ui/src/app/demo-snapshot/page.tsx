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
  const [vote, setVote] = useState("");
  const [slip, setSlip] = useState<any | null>(null);
  const [proof, setProof] = useState<any | null>(null);
  const [pinata, setPinata] = useState<any | null>(null);
  const [recoveredAddress, setRecoveredAddress] = useState<
    `0x${string}` | undefined
  >();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [workerMessage, setWorkerMessage] = useState<string>("");

  const proofWorkerRef = useRef<Worker>();

  // https://testnet.snapshot.org/#/mina-anons.eth/proposal/0xfc255b04d5a5e9d39b8aa63694ccd20eed46eec651ae5c2332397f646312db5a
  const proposal =
    "0xfc255b04d5a5e9d39b8aa63694ccd20eed46eec651ae5c2332397f646312db5a";
  const space = "mina-anons.eth";

  // initate proofWorker and listen to callback
  useEffect(() => {
    console.log("init");
    proofWorkerRef.current = new Worker(
      new URL("@/workers/snapshotVoteProof.worker", import.meta.url)
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
    setRecoveredAddress(undefined);
    setSlip(undefined);
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

    let sig = await account?.signMessage({ message: vote });
    setMessage(vote);

    let sig_for_slip = await account?.signMessage({
      message: space + "/proposal/" + proposal,
    });

    setSignature(sig);

    const add = await recoverMessageAddress({
      message: message,
      signature: sig!,
    });

    setRecoveredAddress(account?.address);

    // get slip
    const response = await fetch(
      `/api/slip?space=${space}&proposal=${proposal}&signature=${sig_for_slip}`
    );
    let res = await response.json();

    setSlip(res);

    setIsLoading(false);

    setStep(2);
  };

  // proof generation via posting to local API
  const doGenerateProof = async () => {
    setIsLoading(true);

    const messageHashHex = hashMessage(message);
    const signatureHex = signature;
    const oracle_signature = slip.oracle_signature;
    const slip_id = slip.data.slip_id;

    const postData = {
      messageHashHex,
      signatureHex,
      oracle_signature,
      slip_id,
    };

    // post to local API - requiring user to run Next.js app
    const response = await fetch(`/api/proof-snapshot`, {
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
    console.log("/api/proof-snapshot response", res);
    console.log(res.proof.publicOutput);

    setIsLoading(false);
    setProof({ proof: res.proof, verificationKey: res.verificationKey });
    setStep(3);
  };

  /*
  // instead of posting to local API, do it on UI via worker
  const doGenerateProofViaWorker = async () => {
    setIsLoading(true);

    const messageHashHex = hashMessage(message);
    const signatureHex = signature;
    const oracle_signature = slip.oracle_signature;
    const slip_id = slip.data.slip_id;

    const postData = {
      messageHashHex,
      signatureHex,
      oracle_signature,
      slip_id,
    };

    proofWorkerRef.current?.postMessage(JSON.stringify(postData));

    // these are now done after message === "proof-done" from worker
    // setIsLoading(false);
    // setProof({proof, verificationKey});
    // setStep(3);
  };
  */

  const doPostProof = async () => {
    setIsLoading(true);

    // console.log("proof", proof);

    const postData = {
      message: message,
      proof: proof.proof,
      verificationKey: {
        data: proof.verificationKey.data,
        hash: String(proof.verificationKey.hash.value[1][1]),
      },
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

      <div className="w-full grid place-items-center">
        <div>Mina 🤝 Snapshot.org</div>
        <div className="text-xs text-blue-200 italic mt-1">Private voting for Snapshot.org</div>
      </div>

      <div className="p-4 grid place-items-center">
        {step === 1 && (
          <>
            <div role="alert" className="alert alert-info text-xs">
              <span>💡 Make a vote choice then sign to vote anonymously.</span>
            </div>
            <div className="form-control w-8/12">
              <div className="mt-2 mb-2">🗳️ Voting for... <a className="text-secondary" href="https://testnet.snapshot.org/#/mina-anons.eth/proposal/0xfc255b04d5a5e9d39b8aa63694ccd20eed46eec651ae5c2332397f646312db5a" target="_blank">Proposal #1</a></div>
              <div className="mt-2 text-xs">Make a vote choice</div>

              <div className="mt-2">
                <input
                  type="radio"
                  name="vote"
                  value="YES"
                  onChange={() => setVote("YES")}
                />
                <span className="ml-4">YES</span>
              </div>

              <div className="mt-2">
                <input
                  type="radio"
                  name="vote"
                  value="NO"
                  onChange={() => setVote("NO")}
                />
                <span className="ml-4">NO</span>
              </div>
            </div>
            <button
              className="btn btn-primary btn-wide my-4"
              onClick={() => doSignMessage()}
              disabled={account === null || vote === "" || isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner"></span>Signing ...
                </>
              ) : (
                "Sign to Vote"
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
                ✅ Vote Slip from Vote Oracle is ready.
                <br />
                💡 Anonymous Snapshot vote proof is ready to be generated.
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
              onClick={() => doGenerateProof()}
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
                ✅ Snapshot vote proof is ready.
                <br />
                💡 Post the vote proof for archival on IPFS.
                <br />
                ⚡ Then the vote proof can be posted to Snapshot.org as a
                private vote.
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
                ✅ Snapshot Vote Proof is posted successfully to decentralized web as JSON on
                IPFS
                <br />
                ✅ It will be posted to Snapshot.org sequencer to tally this a valid private vote.
                <br />
                💡 Please refer to https://github.com/0xStruct/mina-anons/tree/main/anon-snapshot/snapshot-sequencer
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

        {step > 2 && proof && (
          <div className="alert text-xs mt-4">
            <span>
              Ownership verified:{" "}
              {proof.proof.publicOutput[0] === "1" ? "✅" : "🚫"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
