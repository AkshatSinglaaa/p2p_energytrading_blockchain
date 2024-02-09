// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EnergySourceVerification {
    address public energyProducer;
    bool public isVerified;

    constructor() {
        energyProducer = msg.sender;
        isVerified = false;

    }

    modifier onlyProducer() {
        require(msg.sender == energyProducer, "Only the energy producer can perform this action");
        _;
    }

    function verifySOurce() external onlyProducer {
        isVerified = false;
    }

}
