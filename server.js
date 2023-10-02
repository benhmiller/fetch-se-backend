const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 8000;

app.use(bodyParser.json());
const { TransactionNode, TransactionList } = require('./transactionLinkedList');

const spendingList = new TransactionList();    // Linked list storing transactions with expendable points
const transactions = [];                       // Array storing entire transaction history
var balance = 0;                               // Tracks the total point balance for the user
var points_per_payer = {}                      // Dictionary tracking points per payer

// 
app.post('/add', (req, res) => {
    const numKeysPassed = Object.keys(req.body).length;
    if(numKeysPassed !== 3) { // Verify correct number of keys
        return res.status(400).json({ error: `Invalid request body. Expected three keys, received ${numKeysPassed}.` });
    }

    let {payer, points, timestamp} = req.body;
    if(!payer || !points || !timestamp) { // Check Key Validity
        return res.status(400).json({ error: 'Invalid request body. Required keys are missing.' });
    }
    
    if (!Number.isInteger(points) || points === 0) { // Check points value
        return res.status(400).json({ error: 'Invalid points. Points must be a non-zero integer.' });
    }

    if (!Date.parse(timestamp)) { // Check timestamp
        return res.status(400).json({ error: 'Invalid timestamp. Timestamp must be a valid date string.' });
    }

    payer = payer.toUpperCase(); // Convert payer to uppercase for consistency
    
    if(payer in points_per_payer) { // Update points_per_payer dictionary (either add to existing points or create new item)
        points_per_payer[payer] += points;
    }
    else {
        points_per_payer[payer] = points;
    }

    balance += points; // Update total point balance for user

    transactions.push({ payer, points, timestamp }); // Add transaction to transaction history

    // Account for negative point transactions
    if(points < 0) { // Decrease available points for spending
        let previousNode = null;
        let currentNode = spendingList.head;

        while (currentNode && points < 0) {
            const { payer: currentPayer, points: currentPoints } = currentNode.transaction;
            if (currentPayer === payer) {
                if (currentPoints >= Math.abs(points)) { // All negative points accounted by transaction
                    currentNode.transaction.points -= Math.abs(points);
                    points = 0; // All negative points have been accounted for
                }
                else { // Negative points partially accounted by transaction
                    points += currentPoints;
                    currentNode.transaction.points = 0;
                }

                // If points in the current transaction have been reduced to zero, remove it
                if (currentNode.transaction.points === 0) {
                    if(!previousNode) { // Removing head of list
                        spendingList.removeHead()
                    }
                    else { // Remove internal node (possibly tail)
                        previousNode.next = currentNode.next
                        if(currentNode === spendingList.tail) {
                            spendingList.tail = previousNode;
                        }
                    }
                }
            }
            previousNode = currentNode;
            currentNode = currentNode.next;
        }
    }
    else { // Add positive point transaction to spending list
        spendingList.addTransaction({ payer, points, timestamp });
    }

    console.log(transactions);
    console.log(spendingList);
    res.sendStatus(200);
});

app.post('/spend', (req, res) => {
    // Verify correct number of keys
    const numKeysPassed = Object.keys(req.body).length;
    if(numKeysPassed !== 1) {
        return res.status(400).json({ error: `Invalid request body. Expected one key, received ${numKeysPassed}.` });
    }

    // Attempt to extract key and check validity
    const {points} = req.body;
    if(!points) {
        return res.status(400).json({ error: 'Invalid request body. Required key is missing.' });
    }

    // Check points value
    if (!Number.isInteger(points) || (balance - points) < 0) {
        return res.status(400).json({ error: `Invalid points. Points must be an integer less than or equal to the current balance: ${balance}.` });
    }

    // Perform spend operation
    const transactionsUsed = [];
    let pointsSpent = 0;
    while(points - pointsSpent > 0) {
        const transaction = spendingList.peekHead();
        const { payer, points: transactionPoints } = transaction;

        if (transactionPoints <= points - pointsSpent) { // Spend the entire transaction
            spendingList.removeHead();
            transactionsUsed.push({ payer, points: -transactionPoints });
            points_per_payer[payer] -= transactionPoints;
            pointsSpent += transactionPoints;
        } else { // Partially spend the transaction and update spending list
            transactionsUsed.push({ payer, points: -(points - pointsSpent) });
            points_per_payer[payer] -= points - pointsSpent;
            transaction.points -= points - pointsSpent;
            pointsSpent = points;
        }
    }

    // Update Balance
    balance -= points;

    console.log('Transactions used:', transactionsUsed);
    res.sendStatus(200);
});

app.get('/balance', (req, res) => {
    res.status(200).json(points_per_payer);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});