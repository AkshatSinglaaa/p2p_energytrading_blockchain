const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EnergyToken", function () {
  let energyToken;
  let mockOracle;
  let deployer;
  let accounts;

  const name = "EnergyToken";
  const symbol = "ETKN";
  const initialSupply = ethers.utils.parseEther("0");

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    deployer = accounts[0];

    const MockOracleFactory = await ethers.getContractFactory("MockOracle");
    mockOracle = await MockOracleFactory.deploy();
    await mockOracle.deployed();

    const EnergyTokenFactory = await ethers.getContractFactory("EnergyToken");
    energyToken = await EnergyTokenFactory.deploy(
      name,
      symbol,
      mockOracle.address, // Use the mock oracle address
      "0x0", // jobId can be any value for testing
      0, // fee can be 0 for testing
      mockOracle.address // Use the mock oracle for price feed as well
    );
    await energyToken.deployed();

    // Make sure to update the mock oracle with the deployed EnergyToken address
    // This step is required if your mock oracle needs to know the EnergyToken address
    await mockOracle.setEnergyTokenAddress(energyToken.address);
  });

  it("should be deployed with correct parameters", async function () {
    expect(await energyToken.name()).to.equal(name);
    expect(await energyToken.symbol()).to.equal(symbol);
  });

  it("should mint tokens upon fulfilling energy data request", async function () {
    const requestId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("request1")); // Mock request ID
    const energyGenerated = 1000; // Mock energy generated value

    // Simulate the oracle's fulfillment directly through the mock
    await mockOracle.simulateFulfillment(requestId, energyGenerated);

    // Check if the tokens were minted correctly
    const deployerBalance = await energyToken.balanceOf(deployer.address);
    expect(deployerBalance).to.equal(energyGenerated);
  });

  // Additional tests can be added here
});
