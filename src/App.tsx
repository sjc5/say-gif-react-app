import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { abi } from "./utils/GifPronunciationPortal.json";
import "./App.css";

function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [softTotal, setSoftTotal] = useState(null);
  const [hardTotal, setHardTotal] = useState(null);

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("make sure you have metamask!");
        return;
      } else {
        console.log("we have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
      } else {
        console.log("no authorized account found");
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (e) {
      console.warn(e);
    }
  };

  const getTotals = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const gifPronunciationPortalContract = new ethers.Contract(
          "0xeDeb5ECb0e1AFC92c28d22aFdD4659418c3a3225",
          abi,
          signer,
        );

        let softs = await gifPronunciationPortalContract.getSoftTotal();
        setSoftTotal(softs.toNumber());
        let hards = await gifPronunciationPortalContract.getHardTotal();
        setHardTotal(hards.toNumber());
      } else {
        console.log("Ethereum object doesn't exist");
      }
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    getTotals();
  }, []);

  return (
    <div id="App">
      <div>
        <button
          onClick={() => {
            const classList = document.getElementById("App")?.classList;
            if (classList?.contains("dark")) {
              classList?.remove("dark");
            } else {
              classList?.add("dark");
            }
          }}
        >
          dark
        </button>
      </div>
      <h1>How do you pronounce 'GIF'?</h1>
      {!currentAccount && (
        <button onClick={connectWallet}>Connect MetaMask Wallet</button>
      )}
      {currentAccount && (
        <div>
          <div className="info">You are logged in as: {currentAccount}</div>

          {/* <button onClick={castSoftVote}>Cast Soft Vote</button> */}
        </div>
      )}
      <div className="button-container">
        <div>
          <button>🥜 JIF</button>
          <p>soft g, like "giraffe"</p>
          <div>Soft Votes: {softTotal}</div>
        </div>
        <div>
          <button>🎁 GIF</button>
          <p>hard g, like "girlfriend"</p>
          <div>Hard Votes: {hardTotal}</div>
        </div>
      </div>
    </div>
  );
}

export default App;
