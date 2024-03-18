"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

function App() {
  const pathname = usePathname();

  const clubId = pathname?.split("/")[2];

  const [rows, setRows] = useState<string>("");
  const [root, setRoot] = useState<string>("");
  const [proof, setProof] = useState<any>();
  const [index, setIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [initiated, setInitiated] = useState(false);

  useEffect(() => {
    if (!initiated) initiateClub();
  }, []); // for initiation, load members of a club if there is a db already

  const initiateClub = async () => {
    let bodyData = {
      action: "initiate",
      clubId,
    };

    const response = await fetch(`/api/club`, {
      method: "POST",
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData), // body data type must match "Content-Type" header
    });

    let res = await response.json();
    console.log("/api/club load response", res);

    setRows(res.rows);
    setRoot(res.merkleRoot);
    setInitiated(true);
    setIsLoading(false);
  };

  const updateClub = async () => {
    setIsLoading(true);

    let bodyData = {
      action: "update",
      clubId,
      rows: rows.trim(),
    };

    const response = await fetch(`/api/club`, {
      method: "POST",
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData), // body data type must match "Content-Type" header
    });

    let res = await response.json();
    console.log("/api/club update response", res);

    setRoot(res.merkleRoot);
    setIsLoading(false);
  };

  const getProof = async () => {
    setIsLoading(true);

    let bodyData = {
      action: "getProof",
      clubId,
      merkleProofIndex: index,
    };

    const response = await fetch(`/api/club`, {
      method: "POST",
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData), // body data type must match "Content-Type" header
    });

    let res = await response.json();
    console.log("/api/club getProof response", res);

    setProof(res);
    setIsLoading(false);
  };

  return (
    <div className="container max-w-4xl mx-auto">
      <div className="mb-16"></div>

      <div className="w-full p-4 grid place-items-center">
        <>
          <h1 className="text-2xl mb-4">🎊 Club: {pathname?.split("/")[2]}</h1>
          <div role="alert" className="alert alert-info text-xs mb-4 w-8/12">
            <span>
              💡 Enter addresses line by line <br />✅ Club members are stored
              in Merkle Tree persisted on LevelDB in [/dbs/
              {pathname?.split("/")[2]}]
            </span>
          </div>
          <label className="form-control w-8/12">
            <div className="label">
              <span className="label-text">Addresses in this club</span>
            </div>
            <textarea
              className={`textarea textarea-bordered h-40 font-mono`}
              id="rows"
              name="rows"
              value={rows}
              onChange={(e) => setRows(e.target.value)}
              placeholder="list of ethereum addresses"
              disabled={!initiated}
            ></textarea>
          </label>
          <button
            className={`btn btn-wide my-4 ${isLoading ? "btn-disabled" : ""}`}
            onClick={() => updateClub()}
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner"></span>
              </>
            ) : (
              <>Update Club Members</>
            )}
          </button>

          <div className="flex flex-row">
            <label className="input input-bordered flex items-center gap-2 mr-4 w-4/12">
              Index:
              <input type="text" className="grow" placeholder="0" value={index} onChange={(e) => setIndex(Number(e.target.value))} />
            </label>
            <button className="btn" onClick={() => getProof()}>
              {isLoading ? (
                <>
                  <span className="loading loading-spinner"></span>
                </>
              ) : (
                <>Get Proof</>
              )}
            </button>
          </div>
        </>

        
          <div className="alert text-xs mt-4">
            <span>
              Merkle Root: {root}<br />
              Merkle Proof Index: {proof?.merkleProofIndex}<br />
              Merkle Proof: ... {JSON.stringify(proof?.merkleProofJSON)?.substring(66, 120)} ...
            </span>
          </div>
      
      </div>
    </div>
  );
}

export default App;
