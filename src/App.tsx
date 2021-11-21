import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { abi } from "./utils/GifPronunciationPortal.json";
import "./App.css";

function App() {
  const [dark, setDark] = useState(
    JSON.parse(localStorage.getItem("dark") || "false"),
  );
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
        alert("You need to install MetaMask!");
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
    console.log("running");
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
    checkIfWalletIsConnected().then(() => getTotals());
  }, []);

  return (
    <div id="App" className={dark ? "dark" : ""}>
      <div className="container">
        <div className="top-buttons">
          <button
            className="small-button"
            onClick={() => {
              if (dark) {
                setDark(false);
                localStorage.setItem("dark", JSON.stringify(false));
              } else {
                setDark(true);
                localStorage.setItem("dark", JSON.stringify(true));
              }
            }}
          >
            Dark
          </button>
        </div>
        <h1>How do you say "GIF"?</h1>

        {!currentAccount && (
          <div>
            <button onClick={connectWallet}>Connect MetaMask to Vote!</button>
          </div>
        )}

        {currentAccount && (
          <div>
            <h2>Place your vote! 👇</h2>
          </div>
        )}
        <div className="button-container">
          <button className="vote-button" disabled={!currentAccount}>
            🦒 JIF<p className="explanation">(like "giraffe")</p>
            {currentAccount && (
              <p className="votes">
                <span>total votes:</span>{" "}
                <span>
                  <b>{softTotal}</b>
                </span>
              </p>
            )}
          </button>
          <button className="vote-button" disabled={!currentAccount}>
            🦍 GIF<p className="explanation">(like "gorilla")</p>
            {currentAccount && (
              <p className="votes">
                <span>total votes:</span> <b>{hardTotal}</b>
              </p>
            )}
          </button>
        </div>
        <div>
          {currentAccount && (
            <div>
              <div className="info">
                You are connected as:{" "}
                <p className="address">{currentAccount}</p>
              </div>
            </div>
          )}

          <p>
            <i>Powered by Ethereum</i>
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
