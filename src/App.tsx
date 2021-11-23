import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { abi } from "./utils/GifPronunciationPortal.json";

function App() {
  const contractAddress = "0x1A1A9e1dC6a2d99AA12821d22c75B917b0C60E5C";

  // HELPERS
  const getEthereum = () => {
    const { ethereum }: any = window;
    return ethereum;
  };

  const getContract = () => {
    const provider = new ethers.providers.Web3Provider(getEthereum());
    const signer = provider.getSigner();
    return new ethers.Contract(contractAddress, abi, signer);
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

  const isDisabled = () => !currentAccount || isMining || !name;

  // STATE
  const [dark, setDark] = useState(getDark());
  const [currentAccount, setCurrentAccount] = useState("");
  const [softTotal, setSoftTotal] = useState(null);
  const [hardTotal, setHardTotal] = useState(null);
  const [status, setStatus] = useState("");
  const [isMining, setIsMining] = useState(false);
  const [votes, setVotes] = useState([]);
  const [name, setName] = useState("");

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
        getAllVotes();
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

  const castVote = async (type: string, name: string) => {
    try {
      if (getEthereum()) {
        const transaction =
          type === "soft"
            ? await getContract().castSoftVote(name)
            : type === "hard"
            ? await getContract().castHardVote(name)
            : null;

        if (transaction === null) return;

        setStatus("Casting your vote...");
        setIsMining(true);

        await transaction?.wait().then(() => {
          setStatus("Success! Your vote was counted.");
          setIsMining(false);
          getTotals();
          getAllVotes();
          setName("");
        });
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const getAllVotes = async () => {
    try {
      if (getEthereum()) {
        const votes = await getContract().getAllVotes();

        setVotes(
          votes.map((vote: any) => {
            return {
              address: vote.voter,
              timestamp: new Date(vote.timestamp * 1000),
              name: vote.name,
            };
          }),
        );
      } else {
        console.log("Ethereum object doesn't exist");
      }
    } catch (e) {
      console.warn(e);
    }
  };

  // HOOKS
  useEffect(() => {
    checkIfWalletIsConnected().then(() => {
      getTotals();
    });
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
        {currentAccount && (
          <div className="info">
            Connected as:{" "}
            <p className="address">
              <b>{currentAccount}</b>
            </p>
          </div>
        )}
        <h1>How Do You Say "GIF"?</h1>

        {!currentAccount && (
          <div>
            <button onClick={connectWallet}>Connect MetaMask to Vote!</button>
          </div>
        )}

        {status !== "Success! Your vote was counted." && (
          <form>
            {currentAccount && (
              <>
                <label htmlFor="name">
                  <>{name ? "✅" : "1️⃣"}</> Enter your name:
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={42}
                  placeholder="Satoshi Nakamoto"
                />

                {name && (
                  <p className="submit">
                    {isMining
                      ? "✅ Casting your vote..."
                      : "2️⃣ Cast your vote 👇"}
                  </p>
                )}
              </>
            )}

            <div className="button-container">
              <button
                className="vote-button"
                onClick={(e) => {
                  e.preventDefault();
                  castVote("soft", name);
                }}
                disabled={isDisabled()}
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
                onClick={(e) => {
                  e.preventDefault();
                  castVote("hard", name);
                }}
                disabled={isDisabled()}
              >
                🦍 GIF<p className="explanation">(like "gorilla")</p>
                {currentAccount && (
                  <p className="votes">
                    <span>total votes:</span> <b>{hardTotal}</b>
                  </p>
                )}
              </button>
            </div>
          </form>
        )}

        {votes.length > 0 && (
          <div>
            <h3>Recent Voters:</h3>
            <ul>
              {votes
                .slice(0, 12)
                .sort((a: any, b: any) => b.timestamp - a.timestamp)
                .map((vote: any, index) => {
                  return (
                    <li key={index}>
                      <div>
                        <b>{vote.name}</b> – {vote.timestamp.toLocaleString()}
                        <div className="address">({vote.address})</div>
                      </div>
                    </li>
                  );
                })}
            </ul>
          </div>
        )}

        <p className="powered">
          <a href={"https://etherscan.io/address/" + contractAddress}>
            view on Etherscan
          </a>
        </p>
        <p className="powered">
          made by{" "}
          <a href="https://twitter.com/samcookdev" target="_blank">
            @samcookdev
          </a>
        </p>
      </div>
    </div>
  );
}

export default App;
