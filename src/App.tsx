import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { abi } from "./utils/GifPronunciationPortal.json";

function App() {
  const contractAddress = "0x417D8d6139A77E03764d1575dd3683D374033Fd9";

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
    } catch (e: any) {
      dark = false;
    }
    return dark;
  };

  const isDisabled = () => !currentAccount || isMining || !name;

  const getCleanVote = (vote: any) => ({
    address: vote.voter,
    timestamp: new Date(vote.timestamp * 1000),
    name: vote.name,
    vote: vote.vote,
  });

  // STATE
  const [dark, setDark] = useState(getDark());
  const [currentAccount, setCurrentAccount] = useState("");
  const [softTotal, setSoftTotal] = useState(null);
  const [hardTotal, setHardTotal] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isMining, setIsMining] = useState(false);
  const [votes, setVotes] = useState([] as any[]);
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
    } catch (e: any) {
      alert(e.message);
      location.reload();
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
    } catch (e: any) {
      alert(e.message);
      location.reload();
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
    } catch (e: any) {
      alert(e.message);
      location.reload();
    }
  };

  const castVote = async (type: string, name: string) => {
    try {
      if (getEthereum()) {
        const transaction = await getContract().castVote(
          name,
          type === "soft" ? true : false,
          { gasLimit: 300000 },
        );

        if (transaction === null) return;

        setIsMining(true);

        await transaction?.wait().then(() => {
          setIsSuccess(true);
          setIsMining(false);
          getAllVotes();
          setName("");
        });
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (e: any) {
      alert(e.message);
      location.reload();
    }
  };

  const getAllVotes = async () => {
    try {
      if (getEthereum()) {
        const votes = await getContract().getAllVotes();

        setVotes(votes.map((vote: any) => getCleanVote(vote)));
      } else {
        console.log("Ethereum object doesn't exist");
      }
    } catch (e: any) {
      alert(e.message);
      location.reload();
    }
  };

  // HOOKS
  useEffect(() => {
    checkIfWalletIsConnected().then(() => {
      getTotals();
    });
  }, [currentAccount]);

  useEffect(() => {
    const onNewVote = () => {
      getAllVotes();
    };

    if (getEthereum()) {
      getContract().on("NewVote", onNewVote);
    }

    return () => {
      if (getContract()) {
        getContract().off("NewVote", onNewVote);
      }
    };
  }, []);

  useEffect(() => {
    if (currentAccount) {
      getTotals();
    }
  }, [votes]);

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
            {dark ? "Dark " : "Light "} Mode
          </button>
        </div>
        <h1>How Do You Say "GIF"?</h1>
        {currentAccount && (
          <div className="info">
            Connected as:{" "}
            <p className="address">
              <b>{currentAccount}</b>
            </p>
            <div className="info mt">
              Be sure to use the Rinkeby Ethereum Testnet!
            </div>
          </div>
        )}

        {!currentAccount && (
          <div>
            <button onClick={connectWallet}>Vote With MetaMask</button>
            <div className="info mt">(Using the Rinkeby Ethereum Testnet)</div>
          </div>
        )}

        <form>
          {currentAccount && !isMining && !isSuccess && (
            <>
              <label htmlFor="name">Enter your name:</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={42}
                placeholder="Satoshi Nakamoto"
              />

              {name && <p className="submit">Cast your vote:</p>}
            </>
          )}

          {isMining && <p className="pending">Transaction pending...</p>}
          {isSuccess && (
            <p className="success">Success! Your vote was counted.</p>
          )}

          <div className="button-container">
            <div>
              <button
                className="vote-button"
                onClick={(e) => {
                  e.preventDefault();
                  castVote("soft", name);
                }}
                disabled={isDisabled()}
              >
                🦒 JIF<p className="explanation">(like "giraffe")</p>
              </button>
              {currentAccount && (
                <div className="tally">
                  <span>Votes:</span>{" "}
                  <b>{(softTotal as any)?.toLocaleString("en-US")}</b>
                </div>
              )}
            </div>
            <div>
              <button
                className="vote-button"
                onClick={(e) => {
                  e.preventDefault();
                  castVote("hard", name);
                }}
                disabled={isDisabled()}
              >
                🦍 GIF<p className="explanation">(like "gorilla")</p>
              </button>
              {currentAccount && (
                <div className="tally">
                  <span>Votes:</span>{" "}
                  <b>{(hardTotal as any)?.toLocaleString("en-US")}</b>
                </div>
              )}
            </div>
          </div>
        </form>

        {votes.length > 0 && (
          <div>
            <h3>Latest Votes:</h3>
            <ul className="vote-list">
              {votes
                .sort((a: any, b: any) => b.timestamp - a.timestamp)
                .slice(0, 12)
                .map((vote: any, index) => {
                  return (
                    <li key={index} className="vote">
                      <div>
                        <span className="flex">
                          <span className="big">
                            {vote.vote === "soft" ? "🦒 " : "🦍 "}
                          </span>
                          <b>{vote.name}</b>
                        </span>

                        <div className="small">
                          {vote.timestamp.toLocaleString()}
                        </div>
                      </div>
                    </li>
                  );
                })}
            </ul>
          </div>
        )}
        <div>
          <p className="footer">
            <a
              href={"https://rinkeby.etherscan.io/address/" + contractAddress}
              target="_blank"
            >
              etherscan
            </a>
            {"  / "}
            <a
              href="https://github.com/sjc5/say-gif-smart-contract"
              target="_blank"
            >
              solidity code
            </a>
            {" / "}
            <a href="https://github.com/sjc5/say-gif-react-app" target="_blank">
              react code
            </a>
          </p>
          <p className="footer mt mb">
            <a href="https://samcook.cc" target="_blank">
              samcook.cc
            </a>
            {" / "}
            <a href="https://twitter.com/samcookdev" target="_blank">
              twitter
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
