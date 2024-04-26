"use client";

import Link from "next/link";
import { useState } from "react";

function App() {
  const [step, setStep] = useState(2);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="container px-4">
        <div className="diff aspect-[16/4]">
          <div className="diff-item-1">
            <div className="bg-secondary font-mono text-primary-content text-6xl font-black grid place-content-center">
              Mina Anons
            </div>
          </div>
          <div className="diff-item-2">
            <div className="bg-base-200 font-mono text-6xl font-black grid place-content-center">
              **** *****
            </div>
          </div>
          <div className="diff-resizer"></div>
        </div>
      </div>
      <div className="container p-10 grid justify-items-center">
        <h1 className="text-5xl font-bold font-serif mb-4">Hello Anon!</h1>
        <p className="py-2 text-sm">
          Privacy is your right! Mina brings privacy to Ethereum, Bitcoin and beyond.
        </p>
        <p className="py-2 text-sm">It is as simple as 1, 2, 3!</p>
        <ul className="steps my-8 px-10 w-full">
          <li
            className={`step ${step > 0 ? "step-secondary" : ""} `}
            onClick={() => setStep(1)}
          >
            Sign
          </li>
          <li
            className={`step ${step > 1 ? "step-secondary" : ""} `}
            onClick={() => setStep(2)}
          >
            Prove
          </li>
          <li
            className={`step ${step > 2 ? "step-secondary" : ""} `}
            onClick={() => setStep(3)}
          >
            Post
          </li>
        </ul>
        <Link className="btn btn-primary btn-wide" href="/demo">
          Demo
        </Link>
      </div>

      <div className="mt-2 w-full grid justify-items-center text-gray-500">
      <div className="text-sm">demo screens:</div>
        <div>
          <a className="btn btn-neutral btn-sm" href="/demo">
            Demo <span className="text-xs italic font-light">Ethereum</span>
          </a>{" "}
          |{" "}
          <a className="btn btn-neutral btn-sm" href="/demo-wagmi">
            Demo <span className="text-xs italic font-light">Wagmi</span>
          </a>{" "}
          |{" "}
          <a className="btn btn-neutral btn-sm" href="/demo-nostr">
            Demo <span className="text-xs italic font-light">BIP340/Nostr</span>
          </a>{" "}
          |{" "}
          <a className="btn btn-neutral btn-sm" href="/demo-snapshot">
            Demo <span className="text-xs italic font-light">Snapshot.org</span>
          </a>
        </div>
        <br />
        <div className="text-sm">other screens:</div>
        <div>
          <a className="btn btn-neutral btn-sm" href="/curate-nostr">
            Curate <span className="text-xs italic font-light">to Nostr</span>
          </a>{" "}
          |{" "}
          <a className="btn btn-neutral btn-sm" href="/curate">
            Curate <span className="text-xs italic font-light">to X</span>
          </a>{" "}
          |{" "}
          <a className="btn btn-neutral btn-sm" href="/club/mambo-5">
            Club
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
