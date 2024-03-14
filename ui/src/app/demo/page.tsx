"use client";

import { useState } from "react";

import {
  hashMessage,
  recoverPublicKey,
  recoverMessageAddress,
  PrivateKeyAccount,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

function App() {
  const [account, setAccount] = useState<PrivateKeyAccount | null>(null);
  const [accountIndex, setAccountIndex] = useState<number | null>(null);
  const [signature, setSignature] = useState<`0x${string}` | undefined>();
  const [message, setMessage] = useState<string>("hello");
  const [merkle, setMerkle] = useState<any | null>(null);
  const [recoveredAddress, setRecoveredAddress] = useState<
    `0x${string}` | undefined
  >();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // these a throw-away privateKeys, generated randomly
  const PRIVATE_KEYS: `0x${string}`[] = [
    "0x23a6856c2506f416cd3d8c2383cd13550b497490265bafabec57917575637846",
    "0x42aa063351f5aedcc3a1fe9c5167e41ec6e33c3826a53ea62567c8bae3089836",
    "0x5785b8988f3b496a9844da71197dc9a641e865edcb5d975908102dc67058d8bd",
    "0xd76db099c34f31a1a363c671dbecea425e42326361e25ea5bb31beb84400cec3",
    "0x9342f63dc524e79ac5624aae5992ec515c8083b1d3e923521254d52203166b72",
  ];

  // create accounts with viem
  let accounts = [
    privateKeyToAccount(PRIVATE_KEYS[0]),
    privateKeyToAccount(PRIVATE_KEYS[1]),
    privateKeyToAccount(PRIVATE_KEYS[2]),
    privateKeyToAccount(PRIVATE_KEYS[3]),
    privateKeyToAccount(PRIVATE_KEYS[4]),
  ];

  const reset = () => {
    setStep(1);
    setMerkle(null);
    setRecoveredAddress(undefined);
  };

  const mockConnect = (i: number) => {
    setAccountIndex(i);
    setAccount(accounts[i]);
    reset();
  };

  const mockDisconnect = () => {
    setAccountIndex(null);
    setAccount(null);
    reset();
  };

  const doSignMessage = async () => {
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

    setStep(2);
  };

  const doGenerateProof = async () => {
    setIsLoading(true);

    const postData = {
      messageHashHex: hashMessage(message),
      signatureHex: signature,
      merkleProofJSON: merkle?.merkleProofJSON,
      merkleProofIndex: accountIndex,
    };

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
      {account !== null && (
        <div className="w-full pt-4 pb-2">
          <div className="float-left p-0">
            <div className="chat chat-start">
              <div className="chat-image avatar">
                <div className="w-10 rounded-full ring ring-success ring-offset-base-100 ring-offset-2">
                  <img
                    src={`https://api.dicebear.com/8.x/thumbs/svg?seed=${account?.address}`}
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
                Mock Wallet of Index #{accountIndex}
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
            {accounts.map((acc, i) => (
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
              disabled={account === null || message.length === 0}
            >
              Sign Message
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
            {isLoading &&(
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
            <button className="btn btn-primary btn-wide my-4">Post Proof</button>
          </>
        )}

        {recoveredAddress && (
          <>
            <div className="alert text-xs">
              <span>
                Recovered Address: {recoveredAddress} <br />
                Signature:{" "}
                {signature?.substring(0, 10) +
                  " ... " +
                  signature?.substring(122)}
              </span>
            </div>
          </>
        )}

        {step > 1 && merkle && (
          <>
            <div className="alert text-xs">
              <span>
                Merkle Root: {merkle?.merkleProofJSON.root} <br />
                Merkle Proof Index: {accountIndex}
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
