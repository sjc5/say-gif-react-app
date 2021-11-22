import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { abi } from "./utils/GifPronunciationPortal.json";

function App() {
  // HELPERS
  const getEthereum = () => {
    const { ethereum }: any = window;
    return ethereum;
  };

  const getContract = () => {
    const provider = new ethers.providers.Web3Provider(getEthereum());
    const signer = provider.getSigner();
    return new ethers.Contract(
      "0xeDeb5ECb0e1AFC92c28d22aFdD4659418c3a3225",
      abi,
      signer,
    );
  };

  const getDark = () => {
    let dark;
    try {
      dark = JSON.parse(localStorage.getItem("dark") || "false");
    } catch (e) {
      dark = false;
    }
    return dark;
  };

  // STATE
  const [dark, setDark] = useState(getDark());
  const [currentAccount, setCurrentAccount] = useState("");
  const [softTotal, setSoftTotal] = useState(null);
  const [hardTotal, setHardTotal] = useState(null);
  const [status, setStatus] = useState("");
  const [isMining, setIsMining] = useState(false);

  // LOGIC
  const checkIfWalletIsConnected = async () => {
    try {
      if (!getEthereum()) {
        console.log("make sure you have metamask!");
        return;
      } else {
        console.log("we have the ethereum object", getEthereum());
      }

      const accounts = await getEthereum().request({ method: "eth_accounts" });

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
      if (!getEthereum()) {
        alert("You need to install MetaMask!");
        return;
      }

      const accounts = await getEthereum().request({
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
      if (getEthereum() && currentAccount) {
        let softs = await getContract().getSoftTotal();
        setSoftTotal(softs.toNumber());
        let hards = await getContract().getHardTotal();
        setHardTotal(hards.toNumber());
      } else {
        console.log("Ethereum object doesn't exist");
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const castVote = async (type: string) => {
    try {
      if (getEthereum()) {
        const transaction =
          type === "soft"
            ? await getContract().castSoftVote()
            : type === "hard"
            ? await getContract().castHardVote()
            : null;

        if (transaction === null) return;

        setStatus("Casting your vote...");
        setIsMining(true);

        await transaction?.wait().then(() => {
          setStatus("Success! Your vote was counted.");
          setIsMining(false);
          getTotals();
        });
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (e) {
      console.warn(e);
    }
  };

  // HOOKS
  useEffect(() => {
    checkIfWalletIsConnected().then(() => getTotals());
  }, [currentAccount]);

  // UI
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
            Dark Mode
          </button>
        </div>
        <h1>How Do You Say "GIF"?</h1>

        {!currentAccount && (
          <div>
            <button onClick={connectWallet}>Connect MetaMask to Vote!</button>
          </div>
        )}

        {currentAccount && (
          <div>
            <h2>Submit a vote!&nbsp;👇</h2>
          </div>
        )}
        <div className="button-container">
          <button
            className="vote-button"
            onClick={() => castVote("soft")}
            disabled={!currentAccount || isMining}
          >
            🦒 JIF<p className="explanation">(like "giraffe")</p>
            {currentAccount && (
              <p className="votes">
                <span>total votes:</span> <b>{softTotal}</b>
              </p>
            )}
          </button>
          <button
            className="vote-button"
            onClick={() => castVote("hard")}
            disabled={!currentAccount || isMining}
          >
            🦍 GIF<p className="explanation">(like "gorilla")</p>
            {currentAccount && (
              <p className="votes">
                <span>total votes:</span> <b>{hardTotal}</b>
              </p>
            )}
          </button>
        </div>
        {status}
        <div>
          {currentAccount && (
            <div>
              <div className="info">
                You are connected as:{" "}
                <p className="address">{currentAccount}</p>
              </div>
            </div>
          )}

          <p className="powered">Powered by Ethereum</p>
        </div>
      </div>
    </div>
  );
}

export default App;
