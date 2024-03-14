"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";
import { hashMessage, recoverMessageAddress } from "viem";

function App() {
  const account = useAccount();
  const { connectors, connect, status, error } = useConnect();
  const { disconnect } = useDisconnect();

  const [signature, setSignature] = useState<`0x${string}` | undefined>();
  const [message, setMessage] = useState<string>("hello");
  const [merkle, setMerkle] = useState<any | null>(null);
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

    setStep(3);
  };

  return (
    <div className="container px-8">
      {account.status === "connected" && (
        <div className="w-full pt-4 pb-2">
          <div className="float-left">
            <div className="chat chat-start">
              <div className="chat-image avatar">
                <div className="w-10 rounded-full ring ring-success ring-offset-base-100 ring-offset-2">
                  <img
                    src={`https://api.dicebear.com/8.x/thumbs/svg?seed=${account?.addresses[0]}`}
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
            {isPending &&(
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
            <button
              className="btn btn-primary w-full my-4"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <span className="loading loading-spinner"></span>Posting ...
                </>
              ) : (
                "Post Proof"
              )}
            </button>
          </>
        )}

        {recoveredAddress && (
          <>
            <div className="alert text-xs">
              <span>
                Recovered Address: {recoveredAddress} <br />
                Signature:{" "}
                {signMessageData?.substring(0, 8) +
                  " ... " +
                  signMessageData?.substring(124)}
              </span>
            </div>
          </>
        )}

        {errorSign && (
          <div className="alert alert-error text-xs">
            <span>{errorSign.message}</span>
          </div>
        )}

        {step > 1 && merkle && (
          <>
            <div className="alert text-xs">
              <span>
                Merkle Root: {merkle?.merkleProofJSON.root} <br />
                Merkle Proof Index: 0
                <br />
                Merkle Proof:{" "}
                {JSON.stringify(merkle?.merkleProofJSON).substring(0, 96)} ...
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
