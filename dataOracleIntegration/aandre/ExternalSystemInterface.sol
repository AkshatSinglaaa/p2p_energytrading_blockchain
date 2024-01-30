// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ExternalSystemInterface {
    function sendData(uint256 data) external;
}

contract InteroperabilityExample {
    ExternalSystemInterface public externalSystem;

    constructor(address _externalSystemAddress) {
        externalSystem = ExternalSystemInterface(_externalSystemAddress);
    }

    function sendDataToExternalSystem(uint256 data) external {
        // Call the sendData function on the external system
        externalSystem.sendData(data);
    }
}
