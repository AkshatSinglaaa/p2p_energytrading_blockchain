// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IEnergyToken {
    function fulfill(bytes32 _requestId, uint256 _energyGenerated) external;
}

contract MockOracle {
    address private owner;
    address public energyTokenAddress;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function setEnergyTokenAddress(address _energyTokenAddress) public onlyOwner {
        energyTokenAddress = _energyTokenAddress;
    }

    function simulateFulfillment(bytes32 _requestId, uint256 _energyGenerated) public onlyOwner {
        require(energyTokenAddress != address(0), "EnergyToken address not set");
        IEnergyToken(energyTokenAddress).fulfill(_requestId, _energyGenerated);
    }
}
