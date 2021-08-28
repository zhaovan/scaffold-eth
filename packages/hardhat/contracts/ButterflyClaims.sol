pragma solidity >=0.6.0 <0.7.0;
//SPDX-License-Identifier: MIT

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
//learn more: https://docs.openzeppelin.com/contracts/3.x/erc721

// GET LISTED ON OPENSEA: https://testnets.opensea.io/get-listed/step-two

contract ButterflyClaims is ERC721  {

  string[] public phases = [
    "QmdQJ3oWyMU6HuDHDAPZtU1daKpREUP8pUgFX2zSzqZ85j",
    "QmcfUfyfXZTvQUSk7ABjfkm83ejQp4kmwAnAtbXWkZJrhi",
    "Qmb78qREjmXcXyQuEVGjMyF9Jn7guFDvXirjVopLq2sPDY",
    "a",
    "A"
  ];

  mapping (uint256 => uint256) public birth;
  mapping (uint256 => bool) public rare;
  mapping (uint256 => uint256) public currentPhase;

  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  constructor() public ERC721("ButterflyClaims", "BTFLYC") {
    _setBaseURI("https://ipfs.io/ipfs/");

  }

  function claim()
      public
      returns (uint256)
  {
      _tokenIds.increment();

      uint256 id = _tokenIds.current();
      _mint(msg.sender, id);

      birth[id] = block.timestamp;

      //fake random from previous block, you can game this ofc
      if(uint256(keccak256(abi.encodePacked(address(this),id,blockhash(block.number-1))))%5==1){
        rare[id] = true;
      }
      return id;
  }

  function claim2(string memory _p1, string memory _p2, string memory _p3, string memory _p4, string memory _p5)
      public
      returns (uint256)
      {
        phases[0] = _p1;
        phases[1] = _p2;
        phases[2] = _p3;
        phases[3] = _p4;
        phases[4] = _p5;
        _tokenIds.increment();

        uint256 id = _tokenIds.current();
        _mint(msg.sender, id);

        birth[id] = block.timestamp;

        //fake random from previous block, you can game this ofc
        if(uint256(keccak256(abi.encodePacked(address(this),id,blockhash(block.number-1))))%5==1){
          rare[id] = true;
        }
        return id;
      }
  function setPhase(uint256 tokenId, uint256 phase) public {
    console.log("setting phase");
    currentPhase[tokenId] = phase;
  }

  function tokenURI(uint256 tokenId) public view override returns (string memory) {
      require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

      string memory _tokenURI;

      // uint256 age = block.timestamp - birth[tokenId];

      string memory base = baseURI();

      uint256 phase = currentPhase[tokenId];
      _tokenURI = phases[phase];
      // if(age<3600){
      //   _tokenURI = phases[0];
      // }else if(age<3600*2){
      //   _tokenURI = phases[1];
      // }else if(age<3600*3){
      //   _tokenURI = phases[2];
      // }else if(age<3600*4){
      //   _tokenURI = phases[3];
      // }else{
      //   if(rare[tokenId]){
      //     _tokenURI = phases[5];
      //   }else{
      //     _tokenURI = phases[4];
      //   }
      // }

      return string(abi.encodePacked(base, _tokenURI));
  }

}
