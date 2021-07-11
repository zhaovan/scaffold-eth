import React, { FC, ReactElement, useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import 'antd/dist/antd.css';
import {
  ExternalProvider,
  JsonRpcFetchFunc,
  Provider,
  StaticJsonRpcProvider,
  Web3Provider,
} from '@ethersproject/providers';

import '~~/styles/main-page.css';
import { Button, Alert } from 'antd';
import {
  useUserAddress,
  useGasPrice,
  useContractLoader,
  useContractReader,
  useBalance,
  useOnBlock,
  useUserProviderAndSigner,
  DefaultContractLocation,
} from 'eth-hooks';
import { useExchangePrice } from 'eth-hooks/lib/dapps/dex';

import { Header, Account, ThemeSwitcher } from '~~/components/common';

import { useLocalStorage } from '~~/components/common/hooks';
import { GenericContract } from '~~/components/generic-contract';
import { web3ModalProvider, logoutOfWeb3Modal } from '~~/components/layout/web3ModalProvider';
import { Hints, Subgraph } from '~~/components/views';
import { ExampleUI } from '~~/components/views/ExampleUI';
import { transactor } from '~~/helpers';

import { parseEther } from '@ethersproject/units';

import {
  INFURA_ID,
  // DAI_ADDRESS,
  // DAI_ABI,
  // SIMPLE_STREAM_ABI,
  // BUILDERS,
  // mainStreamReader_ADDRESS,
  // mainStreamReader_ABI,
  BUILDS,
} from '~~/models/constants/constants';
import { getNetwork, NETWORKS } from '~~/models/constants/networks';

import pretty from 'pretty-time';
import { ethers, Signer } from 'ethers';

import { TNetwork } from '~~/models/networkTypes';

import { TEthHooksProvider, TProviderAndSigner, TProviderOrSigner } from 'eth-hooks/lib/models';
import { useEventListener } from 'eth-hooks/lib/events';
import { MainPageMenu } from './components/MainPageMenu';
import { MainPageContracts } from './components/MainPageContracts';
import { MainPageExtraUi } from './components/MainPageExtraUi';

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

const translateAddressesForLocal = (addy: string) => {
  // if(addy=="0x90FC815Fe9338BB3323bAC84b82B9016ED021e70") return "0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE"
  // if(addy=="0x21e18260357D33d2e18482584a8F39D532fb71cC") return "0x3Aa5ebB10DC797CAC828524e59A333d0A371443c"
  return addy;
};

/// 📡 What chain are your contracts deployed to?
const targetNetwork: TNetwork = NETWORKS.localhost; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = true;

// 🛰 providers
if (DEBUG) console.log('📡 Connecting to Mainnet Ethereum');
// const mainnetProvider = getDefaultProvider("mainnet", { infura: INFURA_ID, etherscan: ETHERSCAN_KEY, quorum: 1 });
// const mainnetProvider = new InfuraProvider("mainnet",INFURA_ID);
//
// attempt to connect to our own scaffold eth rpc and if that fails fall back to infura...
// Using StaticJsonRpcProvider as the chainId won't change see https://github.com/ethers-io/ethers.js/issues/901
const scaffoldEthProvider = new StaticJsonRpcProvider('https://rpc.scaffoldeth.io:48544');
const mainnetInfura = new StaticJsonRpcProvider('https://mainnet.infura.io/v3/' + INFURA_ID);
// ( ⚠️ Getting "failed to meet quorum" errors? Check your INFURA_I

// 🏠 Your local provider is usually pointed at your local blockchain
const localProviderUrl = targetNetwork.rpcUrl;
// as you deploy to other networks you can set REACT_APP_PROVIDER=https://dai.poa.network in packages/react-app/.env
// const localProviderUrl = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER :
//   localProviderUrl;

if (DEBUG) console.log('🏠 Connecting to provider:', localProviderUrl);
export const localProvider: TEthHooksProvider = new StaticJsonRpcProvider(localProviderUrl);

// 🔭 block explorer URL
export const blockExplorer = targetNetwork.blockExplorer;

export const MainPage: FC<{ subgraphUri: string }> = (props) => {
  const mainnetProvider = scaffoldEthProvider && scaffoldEthProvider._network ? scaffoldEthProvider : mainnetInfura;

  const [injectedProvider, setInjectedProvider] = useState<Web3Provider>();
  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangePrice(targetNetwork, mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, 'fast');
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProviderAndSigner: TProviderAndSigner | undefined = useUserProviderAndSigner(
    injectedProvider,
    localProvider
  );

  const userAddress = useUserAddress(userProviderAndSigner?.signer);

  // You can warn the user if you would like them to be on a specific network
  const localChainId: number = localProvider && localProvider._network && localProvider._network.chainId;
  let selectedChainId: number | undefined;
  if (userProviderAndSigner) {
    userProviderAndSigner.signer?.getChainId().then((chaindId: number) => {
      selectedChainId = chaindId;
    });
  }

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = transactor(userProviderAndSigner?.signer, gasPrice);

  // Faucet Tx can be used to send funds from the faucet
  const faucetTx = transactor(localProvider, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, userAddress);

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, userAddress);

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(
    localProvider,
    { chainId: localChainId },
    DefaultContractLocation.viteAppContracts
  );

  // If you want to make 🔐 write transactions to your contracts, use the userProvider:
  const writeContracts = useContractLoader(userProviderAndSigner?.signer, {}, DefaultContractLocation.viteAppContracts);

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetContracts = useContractLoader(mainnetProvider, {}, DefaultContractLocation.viteAppContracts);

  // If you want to call a function on a new block
  useOnBlock(mainnetProvider, () => {
    console.log(`⛓ A new mainnet block is here: ${mainnetProvider._lastBlockNumber}`);
  });

  // Then read your DAI balance like:
  const myMainnetDAIBalance = useContractReader(mainnetContracts, 'DAI', 'balanceOf', [
    '0x34aA3F359A9D614239015126635CE7732c18fDF3',
  ]);

  // keep track of a variable from the contract in the local React state:
  const purpose = useContractReader<string>(readContracts, 'YourContract', 'purpose');

  // 📟 Listen for broadcast events
  const setPurposeEvents = useEventListener(readContracts, 'YourContract', 'SetPurpose', localProvider, 1);

  /*
  const addressFromENS = useResolveName(mainnetProvider, "austingriffith.eth");
  console.log("🏷 Resolved austingriffith.eth as:",addressFromENS)
  */

  // search filter for front page
  const [filter, setFilter] = useState(() => {
    const { search } = (window as any).location;
    return new URLSearchParams(search).get('s');
  });
  const [filterExplanation, setFilterExplanation] = useState();

  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  useEffect(() => {
    if (DEBUG && mainnetProvider && userAddress && selectedChainId) {
      console.log('_____________________________________ 🏗 scaffold-eth _____________________________________');
      console.log('🌎 mainnetProvider', mainnetProvider);
      console.log('🏠 localChainId', localChainId);
      console.log('👩‍💼 selected address:', userAddress);
      console.log('🕵🏻‍♂️ selectedChainId:', selectedChainId);
      /* console.log("💵 yourLocalBalance",yourLocalBalance?formatEther(yourLocalBalance):"...")
      console.log("💵 yourMainnetBalance",yourMainnetBalance?formatEther(yourMainnetBalance):"...")
      console.log("📝 readContracts",readContracts)
      console.log("🌍 DAI contract on mainnet:",mainnetDAIContract)
      console.log("🔐 writeContracts",writeContracts) */
    }
  }, [mainnetProvider, userAddress, selectedChainId, localChainId]);

  let networkDisplay: ReactElement | undefined;
  if (localChainId != null && selectedChainId && localChainId !== selectedChainId) {
    const description = (
      <div>
        You have <b>{getNetwork(selectedChainId)?.name}</b> selected and you need to be on{' '}
        <b>{getNetwork(localChainId)?.name ?? 'UNKNOWN'}</b>.
      </div>
    );
    networkDisplay = (
      <div style={{ zIndex: 2, position: 'absolute', right: 0, top: 60, padding: 16 }}>
        <Alert message="⚠️ Wrong Network" description={description} type="error" closable={false} />
      </div>
    );
  } else {
    networkDisplay = (
      <div style={{ zIndex: -1, position: 'absolute', right: 154, top: 28, padding: 16, color: targetNetwork.color }}>
        {targetNetwork.name}
      </div>
    );
  }

  const loadWeb3Modal = useCallback(async () => {
    const provider: ExternalProvider | JsonRpcFetchFunc = (await web3ModalProvider.connect()) as
      | ExternalProvider
      | JsonRpcFetchFunc;
    setInjectedProvider(new Web3Provider(provider));
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3ModalProvider.cachedProvider) {
      void loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const [route, setRoute] = useState<string>('');
  useEffect(() => {
    setRoute(window.location.pathname);
  }, [setRoute]);

  let faucetHint: ReactElement = <></>;
  const faucetAvailable = true && localProvider && localProvider.connection && targetNetwork.name === 'localhost';

  const [faucetClicked, setFaucetClicked] = useState(false);
  if (
    !faucetClicked &&
    localProvider &&
    localProvider._network &&
    localProvider._network.chainId === 31337 &&
    yourLocalBalance &&
    yourLocalBalance.toBigInt() <= 0
  ) {
    faucetHint = (
      <div style={{ padding: 16 }}>
        <Button
          type="primary"
          onClick={(): void => {
            if (faucetTx) {
              void faucetTx({
                to: userAddress,
                value: parseEther('0.01'),
              });
            }
            setFaucetClicked(true);
          }}>
          💰 Grab funds from the faucet ⛽️
        </Button>
      </div>
    );
  }

  return (
    <div className="App">
      {/* ✏️ Edit the header and change the title to your project name */}
      <Header />
      {networkDisplay}
      <BrowserRouter>
        <MainPageMenu route={route} setRoute={setRoute} />

        <Switch>
          <Route exact path="/">
            {userProviderAndSigner != null && (
              <>
                {/*
                🎛 this scaffolding is full of commonly used components
                this <Contract/> component will automatically parse your ABI
                and give you a form to interact with it locally
              */}
                <MainPageContracts
                  mainnetContracts={mainnetContracts}
                  mainnetProvider={mainnetProvider}
                  userProviderAndSigner={userProviderAndSigner}
                  localProvider={localProvider}
                  blockExplorerUrl={blockExplorer}
                  userAddress={userAddress}
                />
              </>
            )}
          </Route>
          <Route path="/hints">
            <Hints
              address={userAddress}
              yourLocalBalance={yourLocalBalance}
              mainnetProvider={mainnetProvider}
              price={price}
            />
          </Route>
          <Route path="/exampleui">
            <ExampleUI
              address={userAddress}
              userSigner={userProviderAndSigner?.signer}
              mainnetProvider={mainnetProvider}
              localProvider={localProvider}
              yourLocalBalance={yourLocalBalance}
              price={price}
              tx={tx}
              writeContracts={writeContracts}
              readContracts={readContracts}
              purpose={purpose ?? ''}
              setPurposeEvents={setPurposeEvents}
            />
          </Route>
          <Route path="/mainnetdai">
            {userProviderAndSigner != null && (
              <GenericContract
                contractName="DAI"
                customContract={mainnetContracts?.contracts?.DAI}
                signer={userProviderAndSigner.signer}
                provider={mainnetProvider}
                address={userAddress}
                blockExplorer="https://etherscan.io/"
              />
            )}
          </Route>
          <Route path="/subgraph">
            <Subgraph
              subgraphUri={props.subgraphUri}
              tx={tx}
              writeContracts={writeContracts}
              mainnetProvider={mainnetProvider}
            />
          </Route>
        </Switch>
      </BrowserRouter>

      <ThemeSwitcher />

      {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
      <div style={{ position: 'fixed', textAlign: 'right', right: 0, top: 0, padding: 10 }}>
        <Account
          address={userAddress}
          localProvider={localProvider}
          userSigner={userProviderAndSigner?.signer}
          mainnetProvider={mainnetProvider}
          price={price}
          web3Modal={web3ModalProvider}
          loadWeb3Modal={loadWeb3Modal}
          logoutOfWeb3Modal={logoutOfWeb3Modal}
          blockExplorer={blockExplorer}
        />
        {faucetHint}
      </div>

      {/* 🗺 Extra UI like gas price, eth price, faucet, and support: */}
      <MainPageExtraUi
        mainnetProvider={mainnetProvider}
        price={price}
        gasPrice={gasPrice}
        userAddress={userAddress}
        faucetAvailable={faucetAvailable}
        localProvider={localProvider}
      />
    </div>
  );
};