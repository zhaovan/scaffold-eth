/* eslint-disable jsx-a11y/accessible-emoji */

import { SyncOutlined } from "@ant-design/icons";
import { ethers, utils } from "ethers";
import { Button, Card, DatePicker, Divider, Input, List, Progress, Slider, Spin, Switch, Tooltip } from "antd";
import React, { useState } from "react";
import { Address, Balance } from "../components";

const { TextArea } = Input;

const transpose = a => a[0].map((_, c) => a.map(r => r[c]));

export default function Moloch({
  mainnetProvider,
  tx,
  readContracts,
  writeContracts,
}) {
  const [molochAddress, setMolochAddress] = useState("loading...");
  
  let molochContract

  const buttons = (getter, setter) => (
    <Tooltip placement="right" title="* 10 ** 18">
      <div
        type="dashed"
        style={{ cursor: "pointer" }}
        onClick={async () => {
          try {
            console.log({ getter });
            console.log(utils.parseEther(getter));
            setter(utils.parseEther(getter));
          } catch {
            console.log("enter a value");
          }
        }}
      >
        ✴️
      </div>
    </Tooltip>
  );

  return (
    <div>
      {/*
        ⚙️ Here is an example UI that displays and sets the purpose in your smart contract:
      */}
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 500, margin: "auto", marginTop: 64 }}>
        <h2>Moloch</h2>
        <Divider />
        <div style={{ margin: 8 }}>
          <h2>Moloch Address</h2>
          <p>Enter the address of a Moloch you previously summoned.</p>
          <Input
            onChange={e => {
              setMolochAddress(e.target.value);
            }}
          />
          <Button
            style={{ marginTop: 8 }}
            onClick={async () => {
              molochContract = readContracts && readContracts.Moloch && readContracts.Moloch.attach(molochAddress)
              console.log(molochContract && molochContract.address)
            }}
          >
            Connect to Moloch
          </Button>
        </div>
      </div>

    </div>
  );
}
