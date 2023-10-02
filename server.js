const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 8000;

app.use(bodyParser.json());
const { TransactionNode, TransactionList } = require('./transactionLinkedList');

const spendingList = new TransactionList(); // Linked list storing transactions with expendable points
const transactions = [];                       // Array storing entire transaction history
var balance = 0;                               // Tracks the total point balance for the user
var points_per_payer = {}                      // Dictionary tracking points per payer


app.post('/add', (req, res) => {
    // Verify correct number of keys
    const numKeysPassed = Object.keys(req.body).length;
    if(numKeysPassed !== 3) {
        return res.status(400).json({ error: 'Invalid request body. Expected three keys, received ${numKeysPassed}.' });
    }

    // Attempt to extract keys and check validity
    const {payer, points, timestamp} = req.body;
    if(!payer || !points || !timestamp) {
        return res.status(400).json({ error: 'Invalid request body. Required keys are missing.' });
    }

    // Check points value
    if (!Number.isInteger(points) || points === 0) {
        return res.status(400).json({ error: 'Invalid points. Points must be a non-zero integer.' });
    }

    // Check timestamp
    if (!Date.parse(timestamp)) {
        return res.status(400).json({ error: 'Invalid timestamp. Timestamp must be a valid date string.' });
    }

    // Convert payer to uppercase for consistency
    payer = payer.toUpperCase();
    
    // Update points_per_payer dictionary (either add to existing points or create new item)
    if(payer in points_per_payer) {
        points_per_payer[payer] += points;
    }
    else {
        points_per_payer[payer] = points;
    }
    
    // Update total point balance for user
    balance += points;

    // Add transaction to transaction history
    transactions.push({ payer, points, timestamp });

    // Add transaction to transaction spending list
    spendingList.addTransaction({ payer, points, timestamp });
    
    console.log('Transactions after adding:', transactions);
    console.log(balance);
    console.log(points_per_payer);
    console.log(transactions);
    //console.log(spendingList);
    res.sendStatus(200);
});

app.post('/spend', (req, res) => {
    const points = req.body;
    console.log(points);
    res.sendStatus(200);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
console.log("Hello");