// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./EnergyToken.sol";
import "./init_trade.sol";

contract EnergyTradingPlatform {
    // Define data structures
    struct Transaction {
        address participant1;
        address participant2;
        uint256 energyAmount;
        uint256 price;
        uint256 timestamp;
        bool isCompleted;
    }
    
    struct Proposal {
        address proposer;
        uint256 energyAmount;
        uint256 pricePerUnit;
        uint256 duration;
        bool isActive;
        bool isAccepted;
    }

    struct UserBalance {
        mapping(string => uint256) balances; // Mapping to track balances for different energy types
        mapping(string => uint256) tokenBalances; // Mapping to track token balances
    }
    
    // Define state variables
    mapping(address => Transaction[]) private transactionHistory;
    mapping(uint256 => Proposal) public proposals;
    uint256 public nextProposalID;
    // mapping(address => UserBalance) private userBalances;
    EnergyToken public energyToken;

    
    // Define events
    event TradeInitiated(address indexed participant1, address indexed participant2, uint256 energyAmount, uint256 price, uint256 timestamp);
    event TradeCompleted(address indexed participant1, address indexed participant2, uint256 energyAmount, uint256 price, uint256 timestamp);
    event ProposalCreated(uint256 indexed proposalID, address indexed proposer, uint256 energyAmount, uint256 pricePerUnit, uint256 duration);

    // Function to record a transaction
    function recordTransaction(address _participant1, address _participant2, uint256 _energyAmount, uint256 _price) external {
        require(_participant2 != _participant1, "Cannot trade with yourself");
        require(_energyAmount > 0, "Energy amount must be greater than zero");
        require(_price > 0, "Price must be greater than zero");
        
        // Update transaction history for both participants
        transactionHistory[_participant1].push(Transaction(_participant1, _participant2, _energyAmount, _price, block.timestamp, false));
        transactionHistory[_participant2].push(Transaction(_participant2, _participant1, _energyAmount, _price, block.timestamp, false));
        
        // Emit trade initiated event
        emit TradeInitiated(_participant1, _participant2, _energyAmount, _price, block.timestamp);
    }

    // Function to handle the creation of a new proposal
    function handleProposalCreation(address _proposer, uint256 _energyAmount, uint256 _pricePerUnit, uint256 _duration) external {
        uint256 proposalID = nextProposalID++; // Increment then use as ID
        proposals[proposalID] = Proposal(_proposer, _energyAmount, _pricePerUnit, _duration, true, false);
        emit ProposalCreated(proposalID, _proposer, _energyAmount, _pricePerUnit, _duration);
    }

    // Function to retrieve information about all active proposals
    function getAllProposals() external view returns (Proposal[] memory) {
        Proposal[] memory allProposals = new Proposal[](nextProposalID);
        uint256 proposalCount = 0;
        for (uint256 i = 0; i < nextProposalID; i++) {
            if (proposals[i].isActive) {
                allProposals[proposalCount] = proposals[i];
                proposalCount++;
            }
        }
        return allProposals;
    }
    
    // Function to get all transactions for a user
    function getUserTransactions(address _user) external view returns(Transaction[] memory) {
        return transactionHistory[_user];
    }
    
    // Function to get balance for a specific energy type
    // function getBalance(address user) external view returns (uint256) {
    //     // Assuming the energy token balance is the same as the user's balance
    //     return energyToken.balanceOf(user);
    // }

    event ProposalIsActive(uint256 indexed proposalID);
    event ProposalIsNotAccepted(uint256 indexed proposalID);
    event SufficientBalanceToExecuteTrade(address indexed executor, uint256 amount);
    event TradeProposalAccepted(uint256 indexed proposalID, address indexed acceptor);
    event TradeExecuted(uint256 indexed proposalID, address indexed proposer, address indexed executor, uint256 energyAmount, uint256 totalPrice);
    event EnergyTokensTransferred(address indexed from, address indexed to, uint256 amount);
    event PaymentTransferred(address indexed from, address indexed to, uint256 amount);
    event TransactionRecorded(address indexed from, address indexed to, uint256 energyAmount, uint256 price);
    

    function executeTrade(uint256 proposalID, address buyer) public {
        //proposals = this.getAllProposals();
        Proposal storage proposal = proposals[proposalID];
        require(proposal.isActive, "Proposal is not active.");
        emit ProposalIsActive(proposalID); // Emit log for active proposal
        require(!proposal.isAccepted, "Proposal has already been accepted.");
        emit ProposalIsNotAccepted(proposalID); // Emit log for proposal not being accepted

        // Ensure buyer and proposer are not the same
        require(buyer != proposal.proposer, "You Cannot trade with self.");


        // 1. Check if the executor has enough tokens to cover the payment:
        require(energyToken.balanceOf(buyer) >= proposal.energyAmount * proposal.pricePerUnit, "Insufficient balance to execute trade");
        emit SufficientBalanceToExecuteTrade(buyer, proposal.energyAmount * proposal.pricePerUnit); // Emit log for sufficient balance

        // 3. Transfer payment from the executor to the proposer:
        require(energyToken.transferFrom(buyer, proposal.proposer, proposal.energyAmount * proposal.pricePerUnit), "Insufficient payment balance");
        emit PaymentTransferred(buyer, proposal.proposer, proposal.energyAmount * proposal.pricePerUnit);

        // 5. Update trade status and log details:
        proposal.isActive = false;
        // emit ProposalExecuted(proposalID, proposal.proposer, msg.sender, proposal.energyAmount, proposal.energyAmount * proposal.pricePerUnit);

        emit TransactionRecorded(proposal.proposer, buyer, proposal.energyAmount, proposal.pricePerUnit);
        
        this.recordTransaction(proposal.proposer, buyer, proposal.energyAmount, proposal.pricePerUnit);
    }
}
