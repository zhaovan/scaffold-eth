import { StaticJsonRpcProvider, Web3Provider } from "@ethersproject/providers";
import { formatEther, parseEther } from "@ethersproject/units";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { Alert, Button, Card, Col, Input, List, Menu, Row } from "antd";
import "antd/dist/antd.css";
import { useUserAddress } from "eth-hooks";
import React, { useCallback, useEffect, useState } from "react";
import ReactJson from "react-json-view";
import { BrowserRouter, Link, Route, Switch } from "react-router-dom";
import Web3Modal from "web3modal";
import "./App.css";
import { Account, Address, AddressInput, Contract, Faucet, GasGauge, Header, Ramp, ThemeSwitch } from "./components";
// ZZZ
import Buttons  from "./components";
import { DAI_ABI, DAI_ADDRESS, INFURA_ID, NETWORK, NETWORKS } from "./constants";
import { Transactor } from "./helpers";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useEventListener,
  useExchangePrice,
  useExternalContractLoader,
  useGasPrice,
  useOnBlock,
  useUserProvider,
} from "./hooks";
import { ethers } from "ethers";

import photo1 from "./photos/phase0.png"
import photo2 from "./photos/phase1.png"
import photo3 from "./photos/phase3.png"
import photo4 from "./photos/squarephoto.jpg"

const {Meta} = Card

const { BufferList } = require("bl");
// https://www.npmjs.com/package/ipfs-http-client
const ipfsAPI = require("ipfs-http-client");

const privateKey = "07bf750de4e31049977d280339bed699239029f8c9a6189e0e0bfc7ed87b0b1a"
const etherscanApiKey = "HSUDQ7KJ65AU862W56TVW8NZ794Z6BZN52"

const burnerWalletAddress = "0x97AD09709151Dd106fe1b90C474c9E82481F2afd"
const currWalletAddress= "0x3031E282Fd80dd2bFC8A880b93af37762f44E19b"

const ipfs = ipfsAPI({ host: "ipfs.infura.io", port: "5001", protocol: "https" });
/*
    Welcome to 🏗 scaffold-eth !

    Code:
    https://github.com/austintgriffith/scaffold-eth

    Support:
    https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA
    or DM @austingriffith on twitter or telegram

    You should get your own Infura.io ID and put it in `constants.js`
    (this is your connection to the main Ethereum network for ENS etc.)


    🌏 EXTERNAL CONTRACTS:
    You can also bring in contract artifacts in `constants.js`
    (and then use the `useExternalContractLoader()` hook!)
*/

/// 📡 What chain are your contracts deployed to?
const targetNetwork = NETWORKS.rinkeby;// rinkeby; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

const opensea = "https://testnets.opensea.io/assets/"

// 😬 Sorry for all the console logging
const DEBUG = true;

// EXAMPLE STARTING JSON:
const STARTING_JSON = {
  description: "It's actually a bison?",
  external_url: "https://austingriffith.com/portfolio/paintings/", // <-- this can link to a page for the specific file too
  image: "https://austingriffith.com/images/paintings/buffalo.jpg",
  name: "Buffalo",
  attributes: [
    {
      trait_type: "BackgroundColor",
      value: "green",
    },
    {
      trait_type: "Eyes",
      value: "googly",
    },
  ],
};

// helper function to "Get" from IPFS
// you usually go content.toString() after this...
const getFromIPFS = async hashToGet => {
  for await (const file of ipfs.get(hashToGet)) {
    console.log(file.path);
    if (!file.content) continue;
    const content = new BufferList();
    for await (const chunk of file.content) {
      content.append(chunk);
    }
    console.log(content);
    return content;
  }
};

// 🛰 providers
if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");
// const mainnetProvider = getDefaultProvider("mainnet", { infura: INFURA_ID, etherscan: ETHERSCAN_KEY, quorum: 1 });
// const mainnetProvider = new InfuraProvider("mainnet",INFURA_ID);
//
// attempt to connect to our own scaffold eth rpc and if that fails fall back to infura...
// Using StaticJsonRpcProvider as the chainId won't change see https://github.com/ethers-io/ethers.js/issues/901
const scaffoldEthProvider = new StaticJsonRpcProvider("https://rpc.scaffoldeth.io:48544");
const mainnetInfura = new StaticJsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID);
// ( ⚠️ Getting "failed to meet quorum" errors? Check your INFURA_I

// 🏠 Your local provider is usually pointed at your local blockchain
const localProviderUrl = targetNetwork.rpcUrl;
// as you deploy to other networks you can set REACT_APP_PROVIDER=https://dai.poa.network in packages/react-app/.env
const localProviderUrlFromEnv = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : localProviderUrl;
if (DEBUG) console.log("🏠 Connecting to provider:", localProviderUrlFromEnv);
const localProvider = new StaticJsonRpcProvider(localProviderUrlFromEnv);

// 🔭 block explorer URL
const blockExplorer = targetNetwork.blockExplorer;

/*
  Web3 modal helps us "connect" external wallets:
*/
const web3Modal = new Web3Modal({
  // network: "mainnet", // optional
  cacheProvider: true, // optional
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        infuraId: INFURA_ID,
      },
    },
  },
});

const logoutOfWeb3Modal = async () => {
  await web3Modal.clearCachedProvider();
  setTimeout(() => {
    window.location.reload();
  }, 1);
};
const formData = new FormData()

function App(props) {
  const [forceLookup, setForceLookup] = useState(0);
  const [ images, setImages] = useState([]);
  const [ files, setFiles] = useState([]);
  /// ZZZ
  const uploadToIPFSasJSON = async (value) => {
    let coinOffManifest = STARTING_JSON
    coinOffManifest.description = "user-uploaded nft"
    coinOffManifest.image = `http://5067-2601-602-9700-c060-51d6-482e-e9d5-3f6d.ngrok.io/${value}`
    console.log("Uploading user-uploaded nft...")
    const uploadedCoinOff = await ipfs.add(JSON.stringify(coinOffManifest))
    return uploadedCoinOff
  }

  const onChange = e => {
    const files = Array.from(e.target.files)
    console.log(files)
    setFiles(files)
  }
  
  const onClick = () => {
    const formData = new FormData()
    formData.append(0, files[0])

    console.log(formData.keys())
    fetch(`https://5067-2601-602-9700-c060-51d6-482e-e9d5-3f6d.ngrok.io/image-upload`, {
      method: 'POST',
      body: formData
    })
    .then((res) => {
      return res.json()
    }).then((data) => {
      const {img_paths} = data;
      console.log(img_paths)
      setImages(img_paths)
    }).catch(error => {
      console.log('we\'re fked')
    })
}


  



  const [counter, setCounter] = useState(0);
  let assets = [];

  const mainnetProvider = scaffoldEthProvider && scaffoldEthProvider._network ? scaffoldEthProvider : mainnetInfura;

  const [injectedProvider, setInjectedProvider] = useState();
  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangePrice(targetNetwork, mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast");
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProvider = useUserProvider(injectedProvider, localProvider);
  const address = useUserAddress(userProvider);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId = userProvider && userProvider._network && userProvider._network.chainId;

  // const provider = new ethers.providers.Web3Provider();
  const Wallet = ethers.Wallet;
  const wallet = new Wallet(privateKey);


  const funComments = ["click for a surprise!", "almost there!", "keep going!", "wow this is going for a while!", "omg!"]

  let random = Math.floor(Math.random() * funComments.length)


  function getERC721Transactions(walletAddress) {
    console.log(walletAddress)
    return new Promise((resolve, reject) => {
      const url = `https://api-rinkeby.etherscan.io/api?module=account&action=tokennfttx&address=${walletAddress}&startblock=0&endblock=999999999&sort=asc&apikey=${etherscanApiKey}`
      fetch(url).then((res) => {
        return res.json()
      }).then((res) => {
        resolve(res.result)
      }).catch((err) => reject(err))
    })
  }
  
  function getTokenImages(contractAddress, tokenID) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        fetch(`https://api.opensea.io/api/v1/asset/${contractAddress}/${tokenID}`).then((asset) => {
          resolve({
            url: asset.data.image_url,
            previewUrl: asset.data.image_preview_url,
            thumbnailUrl: asset.data.image_thumbnail_url,
            originalUrl: asset.data.image_original_url,
            name: asset.data.name,
            permalink: asset.data.permalink,
            traits: asset.data.traits,
          })
        }).catch((err) => reject(err))
      }, 300)
    })
  }
  
  function getContractABI(contractAddress) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        fetch(`https://api-rinkeby.etherscan.io/api?module=contract&action=getabi&address=${contractAddress}&apikey=${etherscanApiKey}`).then((res) => {
          return res.json()
        }).then(res=>{
          console.log(res)
          if (res.data.result === 'Contract source code not verified') {
            reject(res.data.result)
          } else resolve(res.data.result)
        }).catch(err => reject(err))
      }, 300)
    })
  }


  async function fetchWalletAssets() {
    const walletAddress = wallet.address;
    const transactions = await getERC721Transactions(walletAddress);
    console.log(transactions)
    for (let i = 0; i < transactions.length; i++) {
      const contractAddress = transactions[i].contractAddress
      console.log("gets here")
      const supply = await readContracts.ButterflyClaims.totalSupply();
      console.log(supply)
      // const tokenId = await readContracts.ButterflyClaims.tokenOfOwnerByIndex(contractAddress,  parseInt(i) + 1);
      // console.log("tokenId", tokenId);
      // const tokenURI = await readContracts.ButterflyClaims.tokenURI(tokenId);
      // console.log("tokenURI", tokenURI);

      // const ipfsHash = tokenURI.replace("https://ipfs.io/ipfs/", "");
      // console.log("ipfsHash", ipfsHash);

      // const jsonManifestBuffer = await getFromIPFS(ipfsHash);
      // this.statusContract = `(${i}/${transactions.length}) ${transactions[i].tokenName}`
      // this.statusAction = 'Downloading contract ABI via Etherscan...'
      // const contractAddress = transactions[i].contractAddress
      // console.log("contract address",contractAddress)
      // let abi = window.localStorage.getItem(contractAddress)
      // if (abi === null) {
      //   // try {
      //   //   abi = await getContractABI(contractAddress)
      //   //   console.log("gets here!")
      //   //   window.localStorage.setItem(contractAddress, abi)
      //   //   console.log('Set abi', contractAddress)
      //   // } catch (err) {
      //   //   console.error('Failed to load ABI for', transactions[i].tokenName, contractAddress)
      //   //   continue
      //   // }
      //   try {
      //     const images = await getTokenImages(contractAddress, transactions[i].tokenID)
      //     console.log(images)
      //     assets.push({
      //       name: transactions[i].tokenName,
      //       symbol: transactions[i].tokenSymbol,
      //       tokenID: transactions[i].tokenID,
      //       images: images
      //     })
      //   } catch (err) {
      //     console.log('Failed to parse', transactions[i].tokenName, contractAddress)
      //   }
      // }
    } 
  }




  // The Metamask plugin also allows signing transactions to
  // send ether and pay to change state within the blockchain.
  // For this, you need the account signer...
  // const signer = provider.getSigner()

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userProvider, gasPrice);

  // Faucet Tx can be used to send funds from the faucet
  const faucetTx = Transactor(localProvider, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address);

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address);

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider);

  // If you want to make 🔐 write transactions to your contracts, use the userProvider:
  const writeContracts = useContractLoader(userProvider);

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetDAIContract = useExternalContractLoader(mainnetProvider, DAI_ADDRESS, DAI_ABI);

  // If you want to call a function on a new block
  useOnBlock(mainnetProvider, () => {
    console.log(`⛓ A new mainnet block is here: ${mainnetProvider._lastBlockNumber}`);
  });

  // Then read your DAI balance like:
  const myMainnetDAIBalance = useContractReader({ DAI: mainnetDAIContract }, "DAI", "balanceOf", [
    "0x34aA3F359A9D614239015126635CE7732c18fDF3",
  ]);

  // keep track of a variable from the contract in the local React state:
  const balance = useContractReader(readContracts, "ButterflyClaims", "balanceOf", [address]);
  console.log("🤗 balance:", balance);

  // 📟 Listen for broadcast events
  const transferEvents = useEventListener(readContracts, "ButterflyClaims", "Transfer", localProvider, 1);
  console.log("📟 Transfer events:", transferEvents);

  //
  // 🧠 This effect will update yourCollectibles by polling when your balance changes
  //
  const yourBalance = balance && balance.toNumber && balance.toNumber();
  const [yourCollectibles, setYourCollectibles] = useState();
  console.log(yourCollectibles)
  const [phaseValue, setPhaseValue] = useState(0);


  useEffect(() => {
    const updateYourCollectibles = async () => {
      const collectibleUpdate = [];
      for (let tokenIndex = 0; tokenIndex < balance; tokenIndex++) {
        try {
          console.log("GEtting token index", tokenIndex);
          const tokenId = await readContracts.ButterflyClaims.tokenOfOwnerByIndex(address, tokenIndex);
          console.log("tokenId", tokenId);
          const tokenURI = await readContracts.ButterflyClaims.tokenURI(tokenId);
          console.log("tokenURI", tokenURI);

          const ipfsHash = tokenURI.replace("https://ipfs.io/ipfs/", "");
          console.log("ipfsHash", ipfsHash);

          const jsonManifestBuffer = await getFromIPFS(ipfsHash);

          try {
            const jsonManifest = JSON.parse(jsonManifestBuffer.toString());
            console.log("jsonManifest", jsonManifest);
            collectibleUpdate.push({ id: tokenId, uri: tokenURI, owner: address, ...jsonManifest });
            //if(tokenIndex>=balance||tokenIndex%9){
            //}
          } catch (e) {
            console.log(e);
          }
        } catch (e) {
          console.log(e);
        }
      }
      setYourCollectibles(collectibleUpdate);
    };
    updateYourCollectibles();
  }, [address, yourBalance, forceLookup]);

  /*
  const addressFromENS = useResolveName(mainnetProvider, "austingriffith.eth");
  console.log("🏷 Resolved austingriffith.eth as:",addressFromENS)
  */

  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  useEffect(() => {
    if (
      DEBUG &&
      mainnetProvider &&
      address &&
      selectedChainId &&
      yourLocalBalance &&
      yourMainnetBalance &&
      readContracts &&
      writeContracts &&
      mainnetDAIContract
    ) {
      console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
      console.log("🌎 mainnetProvider", mainnetProvider);
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
      console.log("💵 yourLocalBalance", yourLocalBalance ? formatEther(yourLocalBalance) : "...");
      console.log("💵 yourMainnetBalance", yourMainnetBalance ? formatEther(yourMainnetBalance) : "...");
      console.log("📝 readContracts", readContracts);
      console.log("🌍 DAI contract on mainnet:", mainnetDAIContract);
      console.log("🔐 writeContracts", writeContracts);
    }
  }, [
    mainnetProvider,
    address,
    selectedChainId,
    yourLocalBalance,
    yourMainnetBalance,
    readContracts,
    writeContracts,
    mainnetDAIContract,
  ]);

  let networkDisplay = "";
  if (localChainId && selectedChainId && localChainId !== selectedChainId) {
    const networkSelected = NETWORK(selectedChainId);
    const networkLocal = NETWORK(localChainId);
    if (selectedChainId === 1337 && localChainId === 31337) {
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
          <Alert
            message="⚠️ Wrong Network ID"
            description={
              <div>
                You have <b>chain id 1337</b> for localhost and you need to change it to <b>31337</b> to work with
                HardHat.
                <div>(MetaMask -&gt; Settings -&gt; Networks -&gt; Chain ID -&gt; 31337)</div>
              </div>
            }
            type="error"
            closable={false}
          />
        </div>
      );
    } else {
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
          <Alert
            message="⚠️ Wrong Network"
            description={
              <div>
                You have <b>{networkSelected && networkSelected.name}</b> selected and you need to be on{" "}
                <b>{networkLocal && networkLocal.name}</b>.
              </div>
            }
            type="error"
            closable={false}
          />
        </div>
      );
    }
  } else {
    networkDisplay = (
      <div style={{ zIndex: -1, position: "absolute", right: 154, top: 28, padding: 16, color: targetNetwork.color }}>
        {targetNetwork.name}
      </div>
    );
  }

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new Web3Provider(provider));
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const [route, setRoute] = useState();
  useEffect(() => {
    setRoute(window.location.pathname);
  }, [setRoute]);

  let faucetHint = "";
  const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name == "localhost";

  const [faucetClicked, setFaucetClicked] = useState(false);
  if (
    !faucetClicked &&
    localProvider &&
    localProvider._network &&
    localProvider._network.chainId == 31337 &&
    yourLocalBalance &&
    formatEther(yourLocalBalance) <= 0
  ) {
    faucetHint = (
      <div style={{ padding: 16 }}>
        <Button
          type="primary"
          onClick={() => {
            faucetTx({
              to: address,
              value: parseEther("0.01"),
            });
            setFaucetClicked(true);
          }}
        >
          💰 Grab funds from the faucet ⛽️
        </Button>
      </div>
    );
  }

  const [yourJSON, setYourJSON] = useState(STARTING_JSON);
  const [sending, setSending] = useState();
  const [ipfsHash, setIpfsHash] = useState();
  const [ipfsDownHash, setIpfsDownHash] = useState();

  const [downloading, setDownloading] = useState();
  const [ipfsContent, setIpfsContent] = useState();

  const [transferToAddresses, setTransferToAddresses] = useState({});

  return (
    <div className="App">
      {/* ✏️ Edit the header and change the title to your project name */}
      <Header />
      {networkDisplay}
      <BrowserRouter>
        <Menu style={{ textAlign: "center" }} selectedKeys={[route]} mode="horizontal">
          <Menu.Item key="/">
            <Link
              onClick={() => {
                setRoute("/");
              }}
              to="/"
            >
              Your Butterflies
            </Link>
          </Menu.Item>
          <Menu.Item key="/transfers">
            <Link
              onClick={() => {
                setRoute("/transfers");
              }}
              to="/transfers"
            >
              Transfers
            </Link>
          </Menu.Item>
          <Menu.Item key="/debugcontracts">
            <Link
              onClick={() => {
                setRoute("/debugcontracts");
              }}
              to="/debugcontracts"
            >
              Smart Contract
            </Link>
          </Menu.Item>
        </Menu>

        <Switch>
          <Route exact path="/">
            {/*
                🎛 this scaffolding is full of commonly used components
                this <Contract/> component will automatically parse your ABI
                and give you a form to interact with it locally
                ZZZ
            */}

            <div style={{ width: 640, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
              <h2>
                Here are possible NFT's you can grab!
              </h2>
              <Row>
                <Col>
              <Card
                cover={<img alt="photo" src={photo1} />}>
                  <Meta title="NFT that you can pick up" description="Minted by Eilleen, this is a photo of Ivan" />
                  <Button style={{marginTop: "1.5rem"}} type={"primary"} onClick={() => {
                    tx(writeContracts.ButterflyClaims.transferFrom(burnerWalletAddress, currWalletAddress, '0x02'))
                    setForceLookup(forceLookup+1)
                  }}>Claim this one</Button>
              </Card>
              </Col>
              <Col>
              <Card
                cover={<img alt="photo" src={photo2} />}>
                  <Meta title="NFT that you can pick up" description="Minted by Eilleen, this is a photo of Ivan" />
                  <Button style={{marginTop: "1.5rem"}} type={"primary"}>Claim this one</Button>
              </Card>
              </Col>
              </Row>


              <Row>
                <Col>
              <Card
                cover={<img alt="photo" src={photo3} />}>
                  <Meta title="NFT that you can pick up" description="Minted by Eilleen, this is a photo of Ivan" />
                  <Button style={{marginTop: "1.5rem"}} type={"primary"}>Claim this one</Button>
              </Card>
              </Col>
              <Col>
              <Card
                cover={<img alt="photo" src={photo4} style={{ width: "300px"}} />}>
                  <Meta title="NFT that you can pick up" description="Minted by Eilleen, this is a forrest" />
                  <Button style={{marginTop: "1.5rem"}} type={"primary"}> Claim this one</Button>
              </Card>
              </Col>
              </Row>


              <div style={{ padding: 32 }}>
                <Button
                  onClick={() => {
                    tx(writeContracts.ButterflyClaims.claim())
                    setPhaseValue(phaseValue.push(0))
                    console.log(phaseValue)
                  }}
                  type={"primary"}
                >
                  Claim
                </Button>
                <Button
                onClick={fetchWalletAssets} >Fetch Wallet Assets</Button>
              </div>
              <input type='file' id='single' onChange={onChange}/>
              <div style={{ padding: 32 }}>
                <Button onClick={onClick}
                >
                  Upload bee woop
          
                </Button>

                <Button onClick={ async () => {
                  var hashes = []
                  for (let i = 0; i < 5; i++) {
                    
                    var hash = await uploadToIPFSasJSON(images[i])
                    hashes.push(hash.path)
                  }
                  console.log(hashes)
                  tx(writeContracts.ButterflyClaims.claim2(hashes[0], hashes[1], hashes[2], hashes[3], hashes[4])) //aaa
                }}>
                  Mint with this uploaded photo
                </Button>
                
              </div>

              <List
                bordered
                dataSource={yourCollectibles}
                renderItem={item => {
                  const id = item.id.toNumber();
                  return (
                    <List.Item key={id + "_" + item.uri + "_" + item.owner}>
                      <Card
                        title={
                          <div>
                            <span style={{ fontSize: 16, marginRight: 8 }}>#{id}</span> {item.name}
                          </div>
                        }
                      >
                        <div style={{ cursor: "pointer" }} onClick={() => {
                          window.open(opensea + readContracts.ButterflyClaims.address + "/" + item.id)
                        }}>
                          <img src={item.image} style={{ maxWidth: 150 }} />
                        </div>
                        {/*<div>{item.description}</div>*/}
                      </Card>

                      <div>
                        owner:{" "}
                        <Address
                          address={item.owner}
                          ensProvider={mainnetProvider}
                          blockExplorer={blockExplorer}
                          fontSize={16}
                        />
                        <AddressInput
                          ensProvider={mainnetProvider}
                          placeholder="transfer to address"
                          value={transferToAddresses[id]}
                          onChange={newValue => {
                            const update = {};
                            update[id] = newValue;
                            setTransferToAddresses({ ...transferToAddresses, ...update });
                          }}
                        />
                        <Input value={phaseValue[id-1]} onChange={(e) => {
                          console.log(e.target.value);                        
                          setPhaseValue(e.target.value);
                        }}></Input>
                        <Button
                          onClick={() => {
                            console.log("writeContracts", writeContracts);
                            tx(writeContracts.ButterflyClaims.transferFrom(address, transferToAddresses[id], id));
                            setForceLookup(forceLookup + 1);
                          }}
                        >
                          Transfer
                        </Button>
                        <Button onClick={() => {
                          console.log("react: changing phase");                    
                          console.log(phaseValue);
                          if (!phaseValue) {
                            return;
                          }
                          tx(writeContracts.ButterflyClaims.setPhase(id, phaseValue[id - 1]));
                          setForceLookup(forceLookup + 1);
                        }}>change phase</Button>
                        <Button onClick={() => {
                          console.log("click")
                          console.log(counter)

                          // const newArray = counter.map((currCounter, idx) => {
                          //   return (idx == id - 1) ? (counter[idx] == undefined ? 0 : counter[idx] + 1) : counter[idx] 
                          // })

                          

                          // if (newArray[id-1] == 5) {
                          //   console.log(id)
                          //   console.log(phaseValue)
                          //   console.log(phaseValue[id-1] + 1)
                          //   //const currentPhaseValue = 
                          //   tx(writeContracts.ButterflyClaims.setPhase(id, phaseValue + 1))
                          //   setForceLookup(forceLookup + 1)
                          // }
                          setCounter(counter+1)
                            if (counter === 5) {
                              setCounter(0)
                              var phaseValue = localStorage.getItem("phase")
                              if (!phaseValue) {
                                phaseValue = 0;
                              }
                              const newPhase = phaseValue+1;
                              //call transaction
                              tx(writeContracts.ButterflyClaims.setPhase(id, newPhase))
                              localStorage.setItem("phase", newPhase)
                            }

                          // console.log(newArray)
                          // // random = Math.floor(Math.random() * funComments.length);

                          // updateCounter(newArray)
                        }}>Click for a surprise!</Button>
                      </div>
                    </List.Item>
                  );
                }}
              />
            </div>
          </Route>

          <Route path="/transfers">
            <div style={{ width: 600, margin: "auto", marginTop: 32, paddingBottom: 32 }}>
              <List
                bordered
                dataSource={transferEvents}
                renderItem={item => {
                  return (
                    <List.Item key={item[0] + "_" + item[1] + "_" + item.blockNumber + "_" + item[2].toNumber()}>
                      <span style={{ fontSize: 16, marginRight: 8 }}>#{item[2].toNumber()}</span>
                      <Address address={item[0]} ensProvider={mainnetProvider} fontSize={16} /> =&gt;
                      <Address address={item[1]} ensProvider={mainnetProvider} fontSize={16} />
                    </List.Item>
                  );
                }}
              />
            </div>
          </Route>

          <Route path="/ipfsup">
            <div style={{ paddingTop: 32, width: 740, margin: "auto", textAlign: "left" }}>
              <ReactJson
                style={{ padding: 8 }}
                src={yourJSON}
                theme="pop"
                enableClipboard={false}
                onEdit={(edit, a) => {
                  setYourJSON(edit.updated_src);
                }}
                onAdd={(add, a) => {
                  setYourJSON(add.updated_src);
                }}
                onDelete={(del, a) => {
                  setYourJSON(del.updated_src);
                }}
              />
            </div>

            <Button
              style={{ margin: 8 }}
              loading={sending}
              size="large"
              shape="round"
              type="primary"
              onClick={async () => {
                console.log("UPLOADING...", yourJSON);
                setSending(true);
                setIpfsHash();
                const result = await ipfs.add(JSON.stringify(yourJSON)); // addToIPFS(JSON.stringify(yourJSON))
                if (result && result.path) {
                  setIpfsHash(result.path);
                }
                setSending(false);
                console.log("RESULT:", result);
              }}
            >
              Upload to IPFS
            </Button>

            <div style={{ padding: 16, paddingBottom: 150 }}>{ipfsHash}</div>
          </Route>
          <Route path="/ipfsdown">
            <div style={{ paddingTop: 32, width: 740, margin: "auto" }}>
              <Input
                value={ipfsDownHash}
                placeHolder="IPFS hash (like QmadqNw8zkdrrwdtPFK1pLi8PPxmkQ4pDJXY8ozHtz6tZq)"
                onChange={e => {
                  setIpfsDownHash(e.target.value);
                }}
              />
            </div>
            <Button
              style={{ margin: 8 }}
              loading={sending}
              size="large"
              shape="round"
              type="primary"
              onClick={async () => {
                console.log("DOWNLOADING...", ipfsDownHash);
                setDownloading(true);
                setIpfsContent();
                const result = await getFromIPFS(ipfsDownHash); // addToIPFS(JSON.stringify(yourJSON))
                if (result && result.toString) {
                  setIpfsContent(result.toString());
                }
                setDownloading(false);
              }}
            >
              Download from IPFS
            </Button>

            <pre style={{ padding: 16, width: 500, margin: "auto", paddingBottom: 150 }}>{ipfsContent}</pre>
          </Route>
          <Route path="/debugcontracts">
            <Contract
              name="ButterflyClaims"
              signer={userProvider.getSigner()}
              provider={localProvider}
              address={address}
              blockExplorer={blockExplorer}
            />
          </Route>
        </Switch>
      </BrowserRouter>

      <ThemeSwitch />

      {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
      <div style={{ position: "fixed", textAlign: "right", right: 0, top: 0, padding: 10 }}>
        <Account
          address={address}
          localProvider={localProvider}
          userProvider={userProvider}
          mainnetProvider={mainnetProvider}
          price={price}
          web3Modal={web3Modal}
          loadWeb3Modal={loadWeb3Modal}
          logoutOfWeb3Modal={logoutOfWeb3Modal}
          blockExplorer={blockExplorer}
        />
        {faucetHint}
      </div>

      {/* 🗺 Extra UI like gas price, eth price, faucet, and support: */}
      <div style={{ position: "fixed", textAlign: "left", left: 0, bottom: 20, padding: 10 }}>
        <Row align="middle" gutter={[4, 4]}>
          <Col span={8}>
            <Ramp price={price} address={address} networks={NETWORKS} />
          </Col>

          <Col span={8} style={{ textAlign: "center", opacity: 0.8 }}>
            <GasGauge gasPrice={gasPrice} />
          </Col>
          <Col span={8} style={{ textAlign: "center", opacity: 1 }}>
            <Button
              onClick={() => {
                window.open("https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA");
              }}
              size="large"
              shape="round"
            >
              <span style={{ marginRight: 8 }} role="img" aria-label="support">
                💬
              </span>
              Support
            </Button>
          </Col>
        </Row>

        <Row align="middle" gutter={[4, 4]}>
          <Col span={24}>
            {
              /*  if the local provider has a signer, let's show the faucet:  */
              faucetAvailable ? (
                <Faucet localProvider={localProvider} price={price} ensProvider={mainnetProvider} />
              ) : (
                ""
              )
            }
          </Col>
        </Row>
      </div>
    </div>
  );
}

/* eslint-disable */
window.ethereum &&
  window.ethereum.on("chainChanged", chainId => {
    web3Modal.cachedProvider &&
      setTimeout(() => {
        window.location.reload();
      }, 1);
  });

window.ethereum &&
  window.ethereum.on("accountsChanged", accounts => {
    web3Modal.cachedProvider &&
      setTimeout(() => {
        window.location.reload();
      }, 1);
  });
/* eslint-enable */

export default App;
