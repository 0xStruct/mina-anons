"use client";

import { useEffect, useRef, useState } from "react";
// import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";
import {
  hashMessage,
  recoverPublicKey,
  recoverMessageAddress,
  PrivateKeyAccount,
} from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";

function App() {
  const [account, setAccount] = useState<PrivateKeyAccount | null>(null);
  const [signature, setSignature] = useState<`0x${string}` | undefined>();
  const [message, setMessage] = useState<string>("hello");
  const [recoveredAddress, setRecoveredAddress] = useState<
    `0x${string}` | undefined
  >();
  const [step, setStep] = useState(1);

  // create accounts with viem
  let accounts = [
    // this is a throw-away privateKey, its address is 0x8B21e9274bDfFc854FCE21c1Ab05f683Fa17B081
    privateKeyToAccount(
      "0x23a6856c2506f416cd3d8c2383cd13550b497490265bafabec57917575637846"
    ),
    // this is a throw-away privateKey, its address is 0x52D244C9094d7D1149773F2954D5a42430794994
    privateKeyToAccount(
      "0x42aa063351f5aedcc3a1fe9c5167e41ec6e33c3826a53ea62567c8bae3089836"
    ),
    privateKeyToAccount(generatePrivateKey()),
    privateKeyToAccount(generatePrivateKey()),
    privateKeyToAccount(generatePrivateKey()),
  ];

  const reset = () => {
    setStep(1);
    setRecoveredAddress(undefined);
  };

  const mockConnect = (i: number) => {
    setAccount(accounts[i]);
    console.log(accounts[i]);
  };

  const mockDisconnect = () => {
    setAccount(null);
  };

  const mockSignMessage = async () => {
    let sig = await account?.signMessage({ message });

    setSignature(sig);

    const add = await recoverMessageAddress({
      message: message,
      signature: sig!,
    });

    const publicKey = await recoverPublicKey({
      hash: hashMessage(message),
      signature: sig!,
    });
    // console.log("recoveredAddress", add, "recoveredPublicKey", publicKey);
    setRecoveredAddress(account?.address);

    setStep(2);
  };

  return (
    <div className="container px-8">
      {account !== null && (
        <div className="w-full pt-4 pb-2">
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
            {accounts.map((account, i) => (
              <li>
                <a
                  className="propotional-nums slashed-zero"
                  key={account.address}
                  onClick={() => mockConnect(i)}
                >
                  {account.address.substring(0, 16)} ...
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {account !== null && (
        <div className="alert text-xs mt-2">
          <span>
            address: {account?.address}
            <br />
            wallet status: mock
          </span>
        </div>
      )}

      <ul className="steps my-4 w-full">
        <li className={`step ${step > 0 ? "step-secondary" : ""} `}>Sign</li>
        <li className={`step ${step > 1 ? "step-secondary" : ""} `}>Prove</li>
        <li className={`step ${step > 2 ? "step-secondary" : ""} `}>Post</li>
      </ul>
      <div className="p-4">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            // const formData = new FormData(event.target);
            // const message = formData.get("message") || "hello";
            mockSignMessage();
          }}
        >
          {step === 1 && (
            <>
              <label className="form-control">
                <div className="label">
                  <span className="label-text">Message</span>
                </div>
                <textarea
                  className="textarea textarea-bordered h-24"
                  id="message"
                  name="message"
                  placeholder="Hello"
                ></textarea>
              </label>
              <button
                className="btn btn-primary w-full my-4"
                disabled={account === null}
              >
                Sign Message
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button className="btn btn-primary w-full my-4">
                Generate Proof
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <button className="btn btn-primary w-full my-4">
                Post Proof
              </button>
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
        </form>
      </div>
    </div>
  );
}

export default App;
