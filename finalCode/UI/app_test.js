

// Import the required ABI and Web3 library
const energyTokenABI = require('./energyTokenABI.json');
const energyPlatformABI = require('./energyPlatformABI.json');
const energyTradingABI = require('./energyTradingABI.json');

const Web3 = require('web3');

// Connect to the Ethereum network using Infura
const web3 = new Web3('http://localhost:8545'); // Replace the URL with your local node's URL

// Define contract addresses
const energyTokenContractAddress = '0xcDA8ab89D01B88309B61b2FCc6bc0C5fCa0Ed1D2';
const energyPlatformContractAddress = '0xBCaB0784a7576A7F9FC88E24927FdAd02923c552';
const energyTradingContractAddress = '0x09A2a87371783E1Bf3c01027eaE7A01A4E75F349';

// Instantiate contract objects
const energyTokenContract = new web3.eth.Contract(energyTokenABI, energyTokenContractAddress);
const energyPlatformContract = new web3.eth.Contract(energyPlatformABI, energyPlatformContractAddress);
const energyTradingContract = new web3.eth.Contract(energyTradingABI, energyTradingContractAddress);

let userBalance = 1000; // Initial balance for demonstration purposes

// Mock function for viewing balance
async function viewBalance(userAddress) {
    // Return the updated user balance
    return userBalance;
}

// Mock function for adding money
async function addMoney(requesterAddress, amount) {
    // Update the user's balance
    userBalance += amount;

    // Return a success message for demonstration purposes
    return 'Money added successfully'; 
}

let mockTradeProposals = [
    { id: 1, proposer: '0xE1F4B1b8AA8b0252Cc66628C39dd97C78CcCcD62', energyAmount: 100, pricePerUnit: 1, duration: 3600 },
    { id: 2, proposer: '0xE1F4B1b8AA8b0252Cc66628C39dd97C78CcCcD62', energyAmount: 200, pricePerUnit: 200, duration: 7200 }
];

let mockTransactionHistory = [
    { from: '0xA276fbF06E538802fA0487560928ff080740AC61', to: '0xE1F4B1b8AA8b0252Cc66628C39dd97C78CcCcD62', energyAmount: 50, price: 1, timestamp: Date.now() - 3600000 },
    { from: '0xE1F4B1b8AA8b0252Cc66628C39dd97C78CcCcD62', to: '0xA276fbF06E538802fA0487560928ff080740AC61', energyAmount: 100, price: 2, timestamp: Date.now() - 7200000 }
];

// Mock function for viewing trade proposals
async function viewTradeProposals() {
    // Return the mock trade proposals
    return mockTradeProposals;
}

// Mock function for viewing transaction history
async function viewTransactionHistory(userAddress) {
    // Return the mock transaction history
    return mockTransactionHistory.filter(tx => tx.from === userAddress || tx.to === userAddress);
}


// Get reference to the View Balance button
const viewBalanceBtn = document.getElementById('view-balance-btn');

// Add event listener to the View Balance button
viewBalanceBtn.addEventListener('click', async () => {
    // Get the user's address from an input field or another source
    const userAddress = '0xE1F4B1b8AA8b0252Cc66628C39dd97C78CcCcD62'; // Replace with actual user's address

    // Call the viewBalance function and handle the result
    const balance = await viewBalance(userAddress);
    console.log('Balance:', balance);

    // Update the HTML to display the balance
    const balanceElement = document.getElementById('balance');
    balanceElement.textContent = `Balance: ${balance}`;
});


// Get reference to the Add Money form
const addMoneyForm = document.getElementById('add-money-form');

// Add event listener to the Add Money form
addMoneyForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent form submission

    // Get the requester's address from an input field or another source
    const requesterAddress = '0xE1F4B1b8AA8b0252Cc66628C39dd97C78CcCcD62'; // Replace with actual requester's address

    // Get the amount from the form input
    const amountInput = document.getElementById('amount');
    const amount = parseInt(amountInput.value);

    // Call the addMoney function and handle the result
    const tx = await addMoney(requesterAddress, amount);
    console.log('Transaction:', tx);

    // Reset the form input
    amountInput.value = '';
});

const viewProposalsBtn = document.getElementById('view-proposals-btn');

// Add event listener to the View Trade Proposals button
viewProposalsBtn.addEventListener('click', async () => {
    // Call the viewTradeProposals function and handle the result
    const proposals = await viewTradeProposals();
    console.log('Proposals:', proposals);

    // Select the table if it already exists, if not create a new one
    let table = document.querySelector('#trade-proposals-section .proposals-table');
    if (!table) {
        table = document.createElement('table');
        table.className = 'proposals-table';
    } else {
        // Clear existing table body
        table.getElementsByTagName('tbody')[0].innerHTML = '';
    }

    // Rebuild table header if it's being created for the first time
    if (!table.querySelector('thead')) {
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Proposal ID</th>
                <th>Proposer</th>
                <th>Energy Amount</th>
                <th>Price Per Unit</th>
                <th>Duration</th>
                <th>Actions</th>
            </tr>
        `;
        table.appendChild(thead);
    }

    // Build table body
    const tbody = table.querySelector('tbody') || document.createElement('tbody');

    proposals.forEach(proposal => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${proposal.id}</td>
            <td>${proposal.proposer}</td>
            <td>${proposal.energyAmount}</td>
            <td>$${proposal.pricePerUnit}</td>
            <td>${convertDuration(proposal.duration)}</td>
            <td></td> <!-- Placeholder for the button -->
        `;

        // Add an 'Execute Trade' button
        const executeTradeBtn = document.createElement('button');
        executeTradeBtn.className = 'execute-trade-btn';
        executeTradeBtn.textContent = 'Execute Trade';
        executeTradeBtn.onclick = function() {
            executeTrade(proposal.id);
        };

        // Append the button to the last cell
        tr.cells[5].appendChild(executeTradeBtn);
        
        tbody.appendChild(tr);
    });

    if (!table.querySelector('tbody')) {
        table.appendChild(tbody); // Append tbody only if it's new
    }
    
    // Append or re-append the table to the proposalsContainer
    const proposalsContainer = document.getElementById('trade-proposals-section');
    proposalsContainer.appendChild(table);
});


// Helper function to convert duration from seconds to a readable format
function convertDuration(seconds) {
    const minutes = seconds / 60;
    if (minutes >= 60) {
        const hours = (minutes / 60).toFixed(2);
        return `${hours} hours`;
    }
    return `${minutes.toFixed(2)} minutes`;
}



const viewHistoryBtn = document.getElementById('view-history-btn');

// Add event listener to the View Transaction History button
viewHistoryBtn.addEventListener('click', async () => {
    // Get the user's address from an input field or another source
    const userAddress = '0xE1F4B1b8AA8b0252Cc66628C39dd97C78CcCcD62'; // Replace with actual user's address

    // Call the viewTransactionHistory function and handle the result
    const history = await viewTransactionHistory(userAddress);
    console.log('History:', history);

    // Select the transaction container and clear any existing table
    const historyContainer = document.getElementById('transaction-history-section');
    let table = historyContainer.querySelector('.transactions-table');
    if (!table) {
        // Create table if it doesn't exist
        table = document.createElement('table');
        table.className = 'transactions-table';
        
        // Create and append the table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>From</th>
                <th>To</th>
                <th>Energy Amount</th>
                <th>Price</th>
                <th>Date</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Create and append the table body
        const tbody = document.createElement('tbody');
        table.appendChild(tbody);
        
        // Append the table to the container
        historyContainer.appendChild(table);
    } else {
        // Clear existing tbody
        table.querySelector('tbody').innerHTML = '';
    }

    // Reference the tbody element
    const tbody = table.querySelector('tbody');

    // Iterate over each transaction and create a row in the table
    history.forEach(transaction => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${transaction.from}</td>
            <td>${transaction.to}</td>
            <td>${transaction.energyAmount}</td>
            <td>${transaction.price}</td>
            <td>${new Date(transaction.timestamp * 1000).toLocaleString()}</td>
        `;
        tbody.appendChild(tr);
    });
});


// Get reference to the Create Proposal form
const createProposalForm = document.getElementById('create-proposal-form');

// Add event listener to the Create Proposal form
createProposalForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent form submission

    // Get the proposer's address from an input field or another source
    const proposerAddress = '0xA276fbF06E538802fA0487560928ff080740AC61'; // Replace with actual proposer's address

    // Get input values from the form
    const energyAmountInput = document.getElementById('energy-amount');
    const pricePerUnitInput = document.getElementById('price-per-unit');
    const durationInput = document.getElementById('duration');

    const energyAmount = parseInt(energyAmountInput.value);
    const pricePerUnit = parseInt(pricePerUnitInput.value);
    const duration = parseInt(durationInput.value);

    // Call the createTradeProposal function and handle the result
    const proposal = { 
        id: mockTradeProposals.length + 1,
        proposer: proposerAddress,
        energyAmount: energyAmount,
        pricePerUnit: pricePerUnit,
        duration: duration
    };
    mockTradeProposals.push(proposal);

    // addTradeProposal(proposal)

    // Reset the form inputs
    energyAmountInput.value = '';
    pricePerUnitInput.value = '';
    durationInput.value = '';

    // Optionally, display a message to the user indicating success or failure
});

// Function to execute a trade proposal
function executeTrade(proposalId) {
    // Find the proposal with the given ID
    const proposal = mockTradeProposals.find(proposal => proposal.id === proposalId);

    if (!proposal) {
        console.error('Proposal not found');
        return;
    }

    // Check if the proposal was proposed by the current user
    if (proposal.proposer === '0xA276fbF06E538802fA0487560928ff080740AC61') { // Replace 'User Address' with the actual user's address
        alert("You cannot execute a trade with your own proposal.");
        return;
    }

    // Calculate the total cost for the proposal
    const totalCost = proposal.energyAmount * proposal.pricePerUnit;

    // Check if the user's balance is sufficient
    if (userBalance < totalCost) {
        // Display a message indicating insufficient funds
        alert('Insufficient funds. Please add more money to your balance.');
        return;
    }

    // Deduct the cost from the user's balance
    userBalance -= totalCost;

    // Add the transaction to the transaction history
    const transaction = {
        from: proposal.proposer,
        to: '0xA276fbF06E538802fA0487560928ff080740AC61', // Replace 'User Address' with the actual user's address
        energyAmount: proposal.energyAmount,
        price: proposal.pricePerUnit,
        timestamp: Date.now() / 1000 // Convert milliseconds to seconds
    };
    mockTransactionHistory.push(transaction);

    // Remove the proposal from the available proposals
    const index = mockTradeProposals.findIndex(p => p.id === proposalId);
    if (index !== -1) {
        mockTradeProposals.splice(index, 1);
    }

    // Update the UI to reflect the changes
    updateUI();
}

// Function to update the UI after executing a trade
function updateUI() {
    // Update the balance display
    const balanceElement = document.getElementById('balance');
    balanceElement.textContent = `Balance: ${userBalance}`;

    // Refresh the trade proposals list
    const viewProposalsBtn = document.getElementById('view-proposals-btn');
    viewProposalsBtn.click(); // Simulate a click to refresh the proposals list

    // Refresh the transaction history
    const viewHistoryBtn = document.getElementById('view-history-btn');
    viewHistoryBtn.click(); // Simulate a click to refresh the transaction history
}

// Get reference to the Execute Trade buttons (assume they have a common class)
const executeTradeBtns = document.querySelectorAll('.execute-trade-btn');

// Add event listener to each Execute Trade button
executeTradeBtns.forEach(button => {
    button.addEventListener('click', () => {
        const proposalId = parseInt(button.dataset.proposalId);
        executeTrade(proposalId);
    });
});