# scaffold-eth - Gitcoin DAO Starter Kit

> Demonstrates Components of the [Gitcoin DAO](https://gitcoin.co/blog/introducing-gtc-gitcoins-governance-token/) and some new features to be integrated in the dao.

<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a>About The Project</a>
    </li>
    <li>
      <a>Getting Started</a>
      <ul>
        <li><a>Installation</a></li>
      </ul>
    </li>
    <li><a>Components</a></li>
    <li><a>Contact</a></li>
  </ol>
</details>

## About The Project

This branch is entitled to showcase all things [Gitcoin DAO](https://gitcoin.co/blog/introducing-gtc-gitcoins-governance-token/)



## Getting Started


### Installation

Let's start our environment for tinkering and exploring how NFT auction would work.

1. Clone the repo first
```sh
git clone -b gitcoin-dao-build https://github.com/austintgriffith/scaffold-eth.git payment-channel
cd scaffold-eth
```

2. Install dependencies
```bash
yarn install
```
3. Start local chain
```bash
yarn chain
```

4. Start your React frontend
```bash
yarn start
```

5. Deploy your smart contracts to a local blockchain
```bash
yarn deploy
```

## Components

### GTC Contract Interaction
A in-house built easy to use UI component allowing to easily interact with the [GTC Contract](https://etherscan.io/address/0xde30da39c46104798bb5aa3fe8b9e0e1f348163f)

![contract](https://user-images.githubusercontent.com/57724812/126625432-0cbd8582-caa3-4a0b-a58a-e420d0935b62.png)

Connect your wallet make sure you are on mainnet and interact!

### Delegator Access
See the list of delegators for a particular delegatee

![list](https://user-images.githubusercontent.com/57724812/126625584-39cf3de0-92f7-4465-914a-79931bf6edef.png)

Enter the delegatee address and see the list of delegators!

### Gnosis Multi-Sig Interaction (WIP)
Allow the DAO members to easily setup a multi-sig wallet with a custom UI and backend

The `yarn chain` and `yarn deploy` commands are for this purposes to deploy the tweaked gnosis contract


## Contact

Join the [telegram support chat 💬](https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA) to ask questions and find others building with 🏗 scaffold-eth!
{"mode":"full","isActive":false}
