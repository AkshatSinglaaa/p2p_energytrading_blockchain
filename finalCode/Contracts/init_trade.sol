// SPDX-License-Identifier: MIT


pragma solidity ^0.8.0;

import "./EnergyToken.sol"; // Make sure this path is correct
import "./EnergyTradingPlatform.sol"; // Import EnergyTradingPlatform contract

contract InitTrade {

    struct TradeProposal {
        address proposer;
        // address executor;
        uint256 energyAmount; // in tokens
        uint256 pricePerUnit;
        uint256 duration; // in seconds
        bool isActive;
        bool isAccepted; // Flag to track whether the proposal has been accepted
    }

    mapping(uint256 => TradeProposal) public tradeProposals; // proposal ID to proposal details
    uint256 public nextProposalID; // counter for unique proposal IDs
    EnergyToken public energyToken; // Instance of the deployed energy token
    EnergyTradingPlatform public energyTradingPlatform; // Declare EnergyTradingPlatform instance
    

    constructor(EnergyToken _energyToken, EnergyTradingPlatform _energyTradingPlatform) {
        energyToken = _energyToken;
        energyTradingPlatform = _energyTradingPlatform; // Initialize EnergyTradingPlatform instance
    }

    event TradeProposalAccepted(uint256 indexed proposalID, address indexed acceptor);
    event TradeExecuted(uint256 indexed proposalID, address indexed proposer, address indexed executor, uint256 energyAmount, uint256 totalPrice);
    event EnergyTokensTransferred(address indexed from, address indexed to, uint256 amount);
    event PaymentTransferred(address indexed from, address indexed to, uint256 amount);
    event TransactionRecorded(address indexed from, address indexed to, uint256 energyAmount, uint256 price);
    event ProposalIsActive(uint256 indexed proposalID);
    event ProposalIsNotAccepted(uint256 indexed proposalID);
    event SufficientBalanceToExecuteTrade(address indexed executor, uint256 amount);
    event ProposalCreated(uint256 indexed proposalID, address indexed proposer, uint256 energyAmount, uint256 pricePerUnit, uint256 duration);


    // Trade Proposal Creation
    function createTradeProposal(address proposer, uint256 _energyAmount, uint256 _pricePerUnit, uint256 _duration) public {
        require(_energyAmount > 0, "Energy amount must be positive.");
        require(_pricePerUnit > 0, "Price per unit must be positive.");
        require(_duration > 0, "Duration must be positive.");
        require(energyToken.balanceOf(proposer) >= _energyAmount, "Insufficient energy balance");

        uint256 proposalID = nextProposalID++;
        tradeProposals[proposalID] = TradeProposal(proposer, _energyAmount, _pricePerUnit, _duration, true, false);

        energyTradingPlatform.handleProposalCreation(proposer, _energyAmount, _pricePerUnit, _duration);
        emit ProposalCreated(proposalID, proposer, _energyAmount, _pricePerUnit, _duration);
    }


    // Listing and Discovering Trade Proposals
    function viewTradeProposals() public view returns (TradeProposal[] memory) {
        TradeProposal[] memory proposals = new TradeProposal[](nextProposalID);
        uint256 count = 0;
        for (uint256 i = 0; i < nextProposalID; i++) {
            if (tradeProposals[i].isActive) {
                proposals[count] = tradeProposals[i];
                count++;
            }
        }
        return proposals;
    }

    // Filter functions based on your desired criteria (e.g., energyType, priceRange, reputation) can be added here

    // Trade Negotiation
    function negotiateTradeProposal(uint256 proposalID, uint256 newPricePerUnit) public {
        TradeProposal storage proposal = tradeProposals[proposalID];
        require(proposal.isActive, "Proposal is not active.");
        require(!proposal.isAccepted, "Proposal has already been accepted.");
        require(msg.sender == proposal.proposer || msg.sender == tx.origin, "Only proposer or interested party can negotiate.");

        proposal.pricePerUnit = newPricePerUnit;
    }

    function acceptTradeProposal(uint256 proposalID) public {
        TradeProposal storage proposal = tradeProposals[proposalID];

        require(proposal.isActive, "Proposal is not active.");
        require(!proposal.isAccepted, "Proposal has already been accepted.");
        // require(msg.sender != proposal.proposer, "Proposer cannot accept their own proposal.");

        // Mark the proposal as accepted
        proposal.isAccepted = true;

        // emit TradeProposalAccepted(proposalID, msg.sender);
    }


    function executeTrade(uint256 proposalID, address to) public {
        TradeProposal storage proposal = tradeProposals[proposalID];
        proposal.proposer = to;

        require(proposal.isActive, "Proposal is not active.");
        // emit ProposalIsActive(proposalID); // Emit log for active proposal
        require(!proposal.isAccepted, "Proposal has already been accepted.");
        // emit ProposalIsNotAccepted(proposalID); // Emit log for proposal not being accepted

        // 1. Check if the executor has enough tokens to cover the payment:
        require(energyToken.balanceOf(msg.sender) >= proposal.energyAmount * proposal.pricePerUnit, "Insufficient balance to execute trade");
        // emit SufficientBalanceToExecuteTrade(msg.sender, proposal.energyAmount * proposal.pricePerUnit); // Emit log for sufficient balance

        // 3. Transfer payment from the executor to the proposer:
        require(energyToken.transferFrom(msg.sender, proposal.proposer, proposal.energyAmount * proposal.pricePerUnit), "Insufficient payment balance");
        // emit PaymentTransferred(msg.sender, proposal.proposer, proposal.energyAmount * proposal.pricePerUnit);

        // 5. Update trade status and log details:
        proposal.isActive = false;
        // emit TradeExecuted(proposalID, proposal.proposer, msg.sender, proposal.energyAmount, proposal.energyAmount * proposal.pricePerUnit);

        // emit TransactionRecorded(proposal.proposer, msg.sender, proposal.energyAmount, proposal.pricePerUnit);

        energyTradingPlatform.recordTransaction(proposal.proposer, msg.sender, proposal.energyAmount, proposal.pricePerUnit);
    }

}