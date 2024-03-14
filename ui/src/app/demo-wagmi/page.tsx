"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";
import { recoverMessageAddress } from "viem";

function App() {
  const account = useAccount();
  const { connectors, connect, status, error } = useConnect();
  const { disconnect } = useDisconnect();
  const [recoveredAddress, setRecoveredAddress] = useState("");
  const [step, setStep] = useState(1);

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
        console.log(variables.message);
        console.log(signMessageData);
        const recoveredAddress = await recoverMessageAddress({
          message: variables?.message,
          signature: signMessageData,
        });
        setRecoveredAddress(recoveredAddress);
        setStep(2);
      }
    })();
  }, [signMessageData, variables?.message]);

  return (
    <div className="container px-8">
      {account.status === "connected" && (
        <div className="w-full pt-4 pb-2">
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
              <li>
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

      <div className="alert text-xs mt-2">
        <span>
          status: {account.status}
          <br />
          addresses: {JSON.stringify(account.addresses)}
          <br />
          chainId: {account.chainId}
          <br />
          wallet status: {status}
        </span>
      </div>

      {error?.message && (
        <div className="alert alert-error text-xs">
          <span>{error?.message}</span>
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
            signMessage({ message: "hello" });
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
                disabled={isPending || account.status !== "connected"}
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
              <button
                className="btn btn-primary w-full my-4"
                disabled={isPending}
              >
                {isPending ? (
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
                  Signature:
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
        </form>
      </div>
    </div>
  );
}

export default App;
