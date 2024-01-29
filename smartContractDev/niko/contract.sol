// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Import Ownable contract for access control
import "@openzeppelin/contracts/access/Ownable.sol";

// Import ChainlinkClient contract for oracle integration - TO BE INTEGRATED
import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract EnergyToken is ChainlinkClient, Ownable {
    using Chainlink for Chainlink.Request;

    // Chainlink-specific variables for oracle integration
    address private oracle;
    bytes32 private jobId;
    uint256 private fee;
    AggregatorV3Interface private priceFeed;

    // Address of the energy generator
    address public energyGenerator;

    constructor(
        string memory _name,
        string memory _symbol,
        address _oracle,
        string memory _jobId,
        uint256 _fee,
        address _priceFeed
    ) ERC20(_name, _symbol) {
        energyGenerator = msg.sender;
        oracle = _oracle;
        jobId = stringToBytes32(_jobId);
        fee = _fee;
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    // Function to request energy data from the oracle
    function requestEnergyData() external onlyEnergyGenerator {
        Chainlink.Request memory req = buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfill.selector
        );
        req.add("get", "https://example.com/api/energy-data"); // Replace with the oracle's API endpoint
        req.add("path", "energy.generated"); // Replace with the correct JSON path
        req.add("times", "100"); // Replace with the appropriate multiplier (e.g., convert kWh to tokens)

        sendChainlinkRequestTo(oracle, req, fee);
    }

    // Callback function to receive response from the oracle
    function fulfill(bytes32 _requestId, uint256 _energyGenerated)
        public
        recordChainlinkFulfillment(_requestId)
    {
        // Mint energy tokens based on the data received from the oracle
        _mint(msg.sender, _energyGenerated);
    }

    // Function to get the latest price feed data from the oracle (for testing)
    function getLatestPrice() public view returns (int) {
        (, int price, , , ) = priceFeed.latestRoundData();
        return price;
    }
