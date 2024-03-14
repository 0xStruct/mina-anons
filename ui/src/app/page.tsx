"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

function App() {
  const account = useAccount();
  const { connectors, connect, status, error } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <div className="container px-4">
      <nav className="dropdown dropdown-end dropdown-bottom w-full py-4 pr-8">
        <label tabIndex={0} className="btn float-right">
          Theme
        </label>
        <ul
          tabIndex={0}
          className="menu dropdown-content rounded-box z-50 w-52 bg-base-100 p-2 shadow"
        >
          <li>
            <a data-set-theme="light">Light</a>
          </li>
          <li>
            <a data-set-theme="dark">Dark</a>
          </li>
          <li>
            <a data-set-theme="cupcake">Cupcake</a>
          </li>
          <li>
            <a data-set-theme="retro">Retro</a>
          </li>
          <li>
            <a data-set-theme="corporate">Corporate</a>
          </li>
          <li>
            <a data-set-theme="business">Business</a>
          </li>
        </ul>
      </nav>

      <ul className="menu menu-vertical lg:menu-horizontal bg-base-200 rounded-box">
        <li>
          <a>Item 1</a>
        </li>
        <li>
          <a>Item 2</a>
        </li>
        <li>
          <a>Item 3</a>
        </li>
      </ul>
      
      <div className="p-4">
        <h2>Account</h2>

        <div>
          status: {account.status}
          <br />
          addresses: {JSON.stringify(account.addresses)}
          <br />
          chainId: {account.chainId}
        </div>

        {account.status === "connected" && (
          <button className="btn btn-primary" onClick={() => disconnect()}>
            Disconnect
          </button>
        )}
      </div>

      <div className="p-4">
        <h2>Connect</h2>
        {connectors.map((connector) => (
          <button
            className="btn"
            key={connector.uid}
            onClick={() => connect({ connector })}
            type="button"
          >
            {connector.name}
          </button>
        ))}
        <div>{status}</div>
        <div>{error?.message}</div>
      </div>
      <div className="p-4">
        <button className="btn btn-primary mx-1">One</button>
        <button className="btn btn-secondary mx-1">Two</button>
        <button className="btn btn-accent btn-outline mx-1">Three</button>
      </div>
      <div className="p-4">
        <button className="btn btn-primary">primary</button>
        <button className="btn btn-secondary">secondary</button>
        <button className="btn btn-accent">accent</button>
      </div>

      <div className="p-4">
        <button className="btn btn-primary">Primary</button>
        <button className="btn btn-secondary">Secondary</button>
        <button className="btn btn-accent">Accent</button>
      </div>

      <div className="tabs tabs-lifted p-4">
        <button className="tab">Tab 1</button>
        <button className="tab tab-active">Tab 2</button>
        <button className="tab">Tab 3</button>
        <button className="tab"></button>
      </div>

      <div className="p-4">
        <input type="checkbox" className="toggle" />
        <input type="checkbox" className="toggle toggle-primary" />
        <input type="checkbox" className="toggle toggle-secondary" />
        <input type="checkbox" className="toggle toggle-accent" />
        <br />
        <input type="checkbox" className="checkbox" />
        <input type="checkbox" className="checkbox-primary checkbox" />
        <input type="checkbox" className="checkbox-secondary checkbox" />
        <input type="checkbox" className="checkbox-accent checkbox" />
        <br />
        <input type="radio" name="radio" className="radio" />
        <input type="radio" name="radio" className="radio-primary radio" />
        <input type="radio" name="radio" className="radio-secondary radio" />
        <input type="radio" name="radio" className="radio-accent radio" />
      </div>

      <div className="card m-4 w-80 shadow">
        <figure>
          <img src="https://picsum.photos/id/103/500/250" />
        </figure>
        <div className="card-body">
          <h2 className="card-title">DaisyUI Card</h2>
          <p>
            Rerum reiciendis beatae tenetur excepturi aut pariatur est eos. Sit
            sit necessitatibus.
          </p>
        </div>
      </div>

      <details className="dropdown m-4">
        <summary className="btn m-1">open/close dropdown</summary>
        <ul className="dropdown-content menu z-[2] w-52 rounded-box bg-base-200 p-2">
          <li>
            <a>Item 1</a>
          </li>
          <li>
            <a>Item 2</a>
          </li>
        </ul>
      </details>

      <button className="btn" onClick={() => alert("hello")}>
        open modal
      </button>
      <dialog id="my_modal_1" className="modal">
        <form method="dialog" className="modal-box">
          <p className="py-4">
            Press ESC key or click the button below to close
          </p>
          <div className="modal-action">
            <button className="btn">Close</button>
          </div>
        </form>
      </dialog>

      <ul className="steps my-4 w-full">
        <li className="step step-primary">Register</li>
        <li className="step step-primary">Choose plan</li>
        <li className="step">Purchase</li>
        <li className="step">Receive Product</li>
      </ul>

      <div className="chat chat-start m-4">
        <div className="avatar chat-image">
          <div className="w-10 rounded-full">
            <img src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg" />
          </div>
        </div>
        <div className="chat-bubble">
          see all components{" "}
          <a
            className="link"
            target="_blank"
            href="https://daisyui.com/components"
          >
            Here
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
