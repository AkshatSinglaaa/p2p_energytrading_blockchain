// Import the required ABI and Web3 library
const energyTokenABI = require('./energyTokenABI.json');
const energyPlatformABI = require('./energyPlatformABI.json');
const energyTradingABI = require('./energyTradingABI.json');

const { ethers } = require('ethers');

// Connect to the Ethereum network using Infura
const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
const signer = provider.getSigner();
const userAddress = '0x1afcA2eE1e5231c820154c3eCe7ca7c5e68CfA8F'; // Replace with actual user's address

// Define contract addresses
const energyTokenContractAddress = '0x808aCD48a25522B5DE3113f50be3f22192Af2308';
const energyPlatformContractAddress = '0x821BAFC159A4A9c85A9F13E92C1d65AeDa66c31D';
const energyTradingContractAddress = '0xa12243d9b0FAD1a4A5451563fBeeF534EeD82Ac4';

const energyTokenContract = new ethers.Contract(energyTokenContractAddress, energyTokenABI, provider);
const energyPlatformContract = new ethers.Contract(energyPlatformContractAddress, energyPlatformABI, provider);
const energyTradingContract = new ethers.Contract(energyTradingContractAddress, energyTradingABI, provider);


// Function to view balance
async function viewBalance(userAddress) {
    try {
        const balance = await energyTokenContract.balanceOf(userAddress);
        console.log('Balance:', balance.toString());
        return balance;
    } catch (error) {
        console.error('Error fetching balance:', error);
        return 'Error fetching balance';
    }
}

// Function to add money with a signer
async function addMoneyWithSigner(signer, requesterAddress, amount) {
    try {
        const tx = await energyTokenContract.connect(signer).transfer(requesterAddress, amount);
        await tx.wait(); // Wait for the transaction to be mined
        return tx;
    } catch (error) {
        console.error('Error adding money:', error);
        return 'Error adding money';
    }
}

// Function to view all trade proposals with a signer
async function viewTradeProposalsWithSigner(signer) {
    try {
        const proposals = await energyPlatformContract.connect(signer).getAllProposals();
        // console.log('Proposals:', proposals);
        // return proposals;
        const activeProposals = proposals.filter(proposal => proposal.isActive);
        console.log('Active Proposals:', activeProposals);
        return activeProposals;
    } catch (error) {
        console.error('Error fetching trade proposals:', error);
        return 'Error fetching trade proposals';
    }
}

// Function to view transaction history
async function viewTransactionHistoryWithSigner(signer, userAddress) {
    try {
        const history = await energyPlatformContract.connect(signer).getUserTransactions(userAddress);
        console.log('History:', history.toString());
        return history;
    } catch (error) {
        console.error('Error fetching transaction history:', error);
        return 'Error fetching transaction history';
    }
}

// Function to create a trade proposal with a signer
async function createTradeProposalWithSigner(signer, energyAmount, pricePerUnit, duration) {
    try {
        // Create a contract instance with the signer
        const energyTradingContractWithSigner = energyTradingContract.connect(signer);
        // Call the createTradeProposal function of the contract with the signer
        const tx = await energyTradingContractWithSigner.createTradeProposal(userAddress, energyAmount, pricePerUnit, duration);
        
        // Wait for the transaction to be mined
        await tx.wait();
        
        // Return the transaction hash
        return tx.hash;
    } catch (error) {
        console.error('Error creating trade proposal:', error);
        return 'Error creating trade proposal';
    }
}

async function executeTradeOnBlockchain(proposalID) {
    try {
        // Call the executeTrade function of the contract
        const tx = await energyPlatformContract.connect(signer).executeTrade(proposalID, userAddress);
        // Wait for the transaction to be mined
        await tx.wait();
        // Log the transaction hash and return it
        console.log('Trade executed, transaction hash:', tx.hash);
        return tx.hash;
    } catch (error) {
        console.error('Error executing trade:', error);
        throw new Error(`Trade execution failed: ${error.message}`);
    }
}



// // Example usage:
// viewBalance(userAddress).then(balance => console.log('Balance:', balance));
// addMoneyWithSigner(signer, userAddress, 100).then(tx => console.log('Transaction:', tx));
// viewTradeProposalsWithSigner(signer).then(proposals => console.log('Proposals:', proposals));
// viewTransactionHistoryWithSigner(signer, userAddress).then(history => console.log('History:', history));
// createTradeProposalWithSigner(signer, 400, 2, 3600).then(txHash => console.log('Transaction Hash:', txHash));
// executeTradeOnBlockchain(3);

// Get reference to the View Balance button
const viewBalanceBtn = document.getElementById('view-balance-btn');

// Add event listener to the View Balance button
viewBalanceBtn.addEventListener('click', async () => {

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

    // Get the amount from the form input
    const amountInput = document.getElementById('amount');
    const amount = parseInt(amountInput.value);

    // Call the addMoney function and handle the result
    const tx = await addMoneyWithSigner(signer, userAddress, amount);
    console.log('Transaction:', tx);

    // Reset the form input
    amountInput.value = '';

    // Optionally, display a message to the user indicating success or failure
});

// Get reference to the View Trade Proposals button
const viewProposalsBtn = document.getElementById('view-proposals-btn');

// Inside the viewProposalsBtn click event listener...
viewProposalsBtn.addEventListener('click', async () => {
    const proposals = await viewTradeProposalsWithSigner(signer);
    console.log('Proposals:', proposals);

    const proposalsTableBody = document.querySelector('#trade-proposals tbody');
    proposalsTableBody.innerHTML = ''; // Clear existing proposals

    proposals.forEach((proposal, index) => {
        const row = proposalsTableBody.insertRow();
        
        const proposalID = index + 1;
        row.insertCell().textContent = proposalID;
        row.insertCell().textContent = proposal.proposer;
        row.insertCell().textContent = proposal.energyAmount;
        row.insertCell().textContent = proposal.pricePerUnit;
        row.insertCell().textContent = proposal.duration;

        const actionCell = row.insertCell();
        const executeButton = document.createElement('button');
        executeButton.textContent = 'Execute Trade';
        executeButton.className = 'execute-trade-btn';

        // Event listener for the executeButton
        executeButton.addEventListener('click', async () => {
            console.log("Proposal ID: ", proposal.id)
            try {
                const buyerAddress = userAddress; // The address of the user executing the trade
                const txHash = await executeTradeOnBlockchain(signer, proposal.id);
                console.log('Trade executed, transaction hash:', txHash);
                alert('Trade executed successfully. Transaction hash: ' + txHash);
                // Refresh the proposals list
                const refreshedProposals = await viewTradeProposalsWithSigner(signer);
                // Call the function to update the table with refreshed proposals
                updateProposalsTable(refreshedProposals, proposalsTableBody);
            } catch (error) {
                alert('Failed to execute trade: ' + error.message);
                console.error('Error executing trade:', error);
            }
        });

        actionCell.appendChild(executeButton);
    });
});

// Helper function to update the proposals table
function updateProposalsTable(proposals, tableBody) {
    tableBody.innerHTML = ''; // Clear existing proposals

    proposals.forEach((proposal) => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = proposal.id;
        row.insertCell().textContent = proposal.proposer;
        row.insertCell().textContent = proposal.energyAmount;
        row.insertCell().textContent = proposal.pricePerUnit;
        row.insertCell().textContent = proposal.duration;

        const actionCell = row.insertCell();
        const executeButton = document.createElement('button');
        executeButton.textContent = 'Execute Trade';
        executeButton.className = 'execute-trade-btn';
        actionCell.appendChild(executeButton);

        // Add the event listener for the new executeButton
        // Add the event listener for the new executeButton
        executeButton.addEventListener('click', async () => {
            try {
                // Confirm before executing the trade
                const confirmExecution = confirm('Are you sure you want to execute this trade?');
                if (confirmExecution) {
                    const buyerAddress = userAddress; // The address of the user executing the trade
                    const txHash = await executeTradeWithSigner(signer, proposal.id);
                    console.log('Trade executed, transaction hash:', txHash);
                    alert('Trade executed successfully. Transaction hash: ' + txHash);
                    // Refresh the proposals list
                    const refreshedProposals = await viewTradeProposalsWithSigner(signer);
                    // Call the function to update the table with refreshed proposals
                    updateProposalsTable(refreshedProposals, proposalsTableBody);
                }
            } catch (error) {
                alert('Failed to execute trade: ' + error.message);
                console.error('Error executing trade:', error);
            }
        });

    });
}


// Get reference to the View Transaction History button
const viewHistoryBtn = document.getElementById('view-history-btn');

// Add event listener to the View Transaction History button
viewHistoryBtn.addEventListener('click', async () => {
    // Call the viewTransactionHistory function and handle the result
    const history = await viewTransactionHistoryWithSigner(signer, userAddress);
    console.log('History:', history);

    // Select the table body where transaction history will be appended
    const historyTableBody = document.querySelector('#transaction-history-table tbody');
    historyTableBody.innerHTML = ''; // Clear existing transaction history

    history.forEach((transaction, index) => {
        // Create a new row for each transaction
        const row = historyTableBody.insertRow();
        
        // Populate the row with transaction details. Convert BigNumber to string if necessary.
        row.insertCell().textContent = transaction.participant1; // Adjust to match your transaction object properties
        row.insertCell().textContent = transaction.participant2; // Adjust to match your transaction object properties
        row.insertCell().textContent = transaction.energyAmount.toString(); // Convert BigNumber to string
        row.insertCell().textContent = transaction.price.toString(); // Convert BigNumber to string
        // Convert the timestamp to a human-readable format if necessary
        row.insertCell().textContent = new Date(transaction.timestamp * 1000).toLocaleString();
    });
});



// Get reference to the Create Proposal form
const createProposalForm = document.getElementById('create-proposal-form');

// Add event listener to the Create Proposal form
createProposalForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent form submission

    // Get input values from the form
    const energyAmountInput = document.getElementById('energy-amount');
    const pricePerUnitInput = document.getElementById('price-per-unit');
    const durationInput = document.getElementById('duration');

    const energyAmount = parseInt(energyAmountInput.value);
    const pricePerUnit = parseInt(pricePerUnitInput.value);
    const duration = parseInt(durationInput.value);

    // Call the createTradeProposal function and handle the result
    const txHash = await createTradeProposalWithSigner(signer, energyAmount, pricePerUnit, duration);
    console.log('Transaction Hash:', txHash);

    // Reset the form inputs
    energyAmountInput.value = '';
    pricePerUnitInput.value = '';
    durationInput.value = '';

});

