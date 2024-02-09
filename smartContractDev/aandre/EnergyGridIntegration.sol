// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EnergyGridIntegration{

    mapping(address => uint256) public  energyConsumption;

    event EnergyConsumed(address consumer, uint256 amount);

    function consumeEnergy(uint256 amount) external {
        energyConsumption[msg.sender] += amount;

        emit  EnergyConsumed(msg.sender, amount);
    }


}
