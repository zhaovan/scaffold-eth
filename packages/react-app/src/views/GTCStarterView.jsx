/* eslint-disable jsx-a11y/accessible-emoji */

import { ConsoleSqlOutlined, SyncOutlined } from "@ant-design/icons";
import { utils } from "ethers";
import { Button, Card, DatePicker, Divider, Input, List, Progress, Slider, Spin, Switch } from "antd";
import React, { useState } from "react";
import {ethers } from "ethers";
import { request } from 'graphql-request';
import Web3 from 'web3'
import Safe, { SafeTransactionDataPartial, EthersAdapter, SafeFactory, Web3Adapter } from '@gnosis.pm/safe-core-sdk'
import { Address, Balance } from "../components";
import externalConfig from "../contracts/external_contracts.js";
export default function GTCStarterView({
  purpose,
  userSigner,
  address,
  mainnetProvider,
  localProvider,
  yourLocalBalance,
  price,
  tx,
  readContracts,
  writeContracts,
}) {
  const [delegatorAddress, setDelegatorAddress] = useState("loading...");
  const [delegate, setDelegate] = useState([]);
  let safeAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
  const signer1 = localProvider.getSigner();
  const ethAdapter = new EthersAdapter({ ethers, signer: signer1 })
  console.log(ethAdapter)


  const endpoint = 'https://api.thegraph.com/subgraphs/name/viraj124/gtc';
  return (
    <div>
      {/*
        ⚙️ Here is an example UI that displays and sets the purpose in your smart contract:
      */}
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 64 }}>
        <h2>GTC Delegator Communication</h2>
        <Divider />
        <div style={{ margin: 8 }}>
          <Input placeholder = "Enter Delgatee Address"
            onChange={async (e) => {
              setDelegatorAddress(e.target.value)
              const DELEGATOR_QUERY = `{
                delegate(id: "${e.target.value}") {
                  delegators
                }
              }`;
              const result = await request(endpoint, DELEGATOR_QUERY);
              if (result && result.delegate && result.delegate.delegators) {
                const delegatee = result.delegate.delegators;
                setDelegate(delegatee)
              }
            }}
          />

<Button
            style={{ marginTop: 8 }}
            onClick={async () => {
              const id = await ethAdapter.getChainId()
              const contractNetworks = {
                [id]: {
                  multiSendAddress: safeAddress,
                  safeMasterCopyAddress: safeAddress,
                  safeProxyFactoryAddress: safeAddress
                }
              }          
              const safeFactory = await SafeFactory.create({ ethAdapter, contractNetworks })
              const owners = ['0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266']
              const threshold = 1
              const safeAccountConfig = { owners, threshold, to: '0x0000000000000000000000000000000000000000', data: '0x', fallbackHandler: '0x0000000000000000000000000000000000000000', paymentToken:'0x0000000000000000000000000000000000000000', payment: 0, paymentReceiver: '0x0000000000000000000000000000000000000000' }
              
              const safeSdk = await safeFactory.deploySafe(safeAccountConfig)
              safeAddress  = safeSdk.getAddress()

              // const safeSdk = await Safe.create({ethAdapter, safeAddress, contractNetworks})
              const partialTx = {
                to: '0x3e35Ba3AD1921fA9a16ccc73fa980CD5fc764730',
                data: '0x0000000000000000000000000000000000000000',
                value: '1000000000000000000'
              }
              const safeTransaction = await safeSdk.createTransaction(partialTx)
              const signer1Signature = await safeSdk.signTransaction(safeTransaction)
              const safeSdk2 = await safeSdk.connect({ ethAdapter, safeAddress })
              const execOptions = { gasLimit: 150000, gas: 45280, safeTxGas:45280  }
              const executeTxResponse = await safeSdk2.executeTransaction(safeTransaction, execOptions)
              const receipt = executeTxResponse.transactionResponse && (await executeTxResponse.transactionResponse.wait())
              const balance = await localProvider.getBalance("0x3e35Ba3AD1921fA9a16ccc73fa980CD5fc764730");
              console.log('bal', balance)

            }}
          >
            Execute Tx
          </Button>
          
        </div>
      </div>
      <div style={{ textAlign: "left", maxWidth: 800, margin: "0 auto" }}>
        <h2 style={{ marginTop: "20px", marginBottom: "10px" }}>Your Delegators</h2>
        {delegate.length === 0 && <p>Fetching delegators..</p>}
        {delegate.map(member => {
          return (
            <div style={{ marginTop: "10px" }}>
              <h3>{member}</h3>
            </div>
          );
        })}
      </div>
    </div>
  );
}
