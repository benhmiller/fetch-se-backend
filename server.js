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

/* Route handler for the HTTP POST method with path '/add'. Handles the addition of a new
 * transaction, which consists of the payer through which the points are added, the number of
 * points to be added, and a timestamp for the transaction.
 * 
 * Expected request body syntax: { "payer" : "DANNON", "points" : 5000, "timestamp" : "2020-11-02T14:00:00Z" }
 */
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
        return res.status(401).json({ error: 'Invalid points. Points must be a non-zero integer.' });
    }

    if (!Date.parse(timestamp)) { // Check timestamp
        return res.status(402).json({ error: 'Invalid timestamp. Timestamp must be a valid date string.' });
    }

    payer = payer.toUpperCase(); // Convert payer to uppercase for consistency

    // Update points_per_payer dictionary (Ensure no payer will have negative points)
    if (payer in points_per_payer) { // Add to existing item
        const newPoints = points_per_payer[payer] + points;
        if (newPoints < 0) {
            return res.status(401).json({ error: 'Invalid points. Points per payer cannot be negative.' });
        }
        points_per_payer[payer] = newPoints;
    }
    else { // Create new item
        if (points < 0) {
            return res.status(401).json({ error: 'Invalid points. Points per payer cannot be negative.' });
        }
        points_per_payer[payer] = points;
    }

    balance += points; // Update total points balance for user

    transactions.push({ payer, points, timestamp }); // Add transaction to transaction history
    
    // Update available points for spending
    if(points < 0) { // Account for negative point transactions by decreasing available points for spending
        let previousNode = null;
        let currentNode = spendingList.head;

        // Search for payer transactions with positive point values to detract from, continue until all negative points accounted for
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

    res.sendStatus(200);
});

/* Route handler for the HTTP POST method with path '/spend'. Handles the spending of a particular number of
 * user points by spending payer points in order of oldest to newest transactions. If the number of points
 * sought to be spent exceeds the user's balance, an error will be thrown.
 * 
 * Expected request body syntax: { "points" : 5000 }
 */
app.post('/spend', (req, res) => {
    const numKeysPassed = Object.keys(req.body).length;
    if(numKeysPassed !== 1) { // Verify correct number of keys
        return res.status(400).json({ error: `Invalid request body. Expected one key, received ${numKeysPassed}.` });
    }

    const {points} = req.body;
    if(!points) { // Attempt to extract key and check validity
        return res.status(400).json({ error: 'Invalid request body. Required key is missing.' });
    }

    if (!Number.isInteger(points) || (balance - points) < 0 || points <= 0) { // Check points value
        return res.status(401).json({ error: `Invalid points. Points must be an integer less than or equal to the current balance: ${balance}.` });
    }

    // Perform spend operation
    const transactionsUsed = []; // Tracks payers with points used
    let pointsSpent = 0;         // Tracks total number of points spent
    
    while(points - pointsSpent > 0) { // Continue through spending list until payer points equals points sought to be spent
        const transaction = spendingList.peekHead();
        const { payer, points: transactionPoints } = transaction;

        if (transactionPoints <= points - pointsSpent) { // Spend the entire transaction
            spendingList.removeHead();
            transactionsUsed.push({ payer, points: -transactionPoints });
            points_per_payer[payer] -= transactionPoints;
            pointsSpent += transactionPoints;
        }
        else { // Partially spend the transaction and update spending list
            transactionsUsed.push({ payer, points: -(points - pointsSpent) });
            points_per_payer[payer] -= points - pointsSpent;
            transaction.points -= points - pointsSpent;
            pointsSpent = points;
        }
    }

    // Update user point balance
    balance -= points; 

    res.status(200).json(transactionsUsed);
});

/* Route handler for the HTTP GET method with path '/balance'. Handles the getting of the number of points
 * a user has from each payer.
 * 
 * Expected response body syntax: { "DANNON": 1000, ”UNILEVER” : 0, "MILLER COORS": 5300 }
 */
app.get('/balance', (req, res) => {
    res.status(200).json(points_per_payer);
});

// Display Greeting
app.get('/', (req, res) => {
    res.send("Welcome, please refer to the README.md for further instructions.")
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});