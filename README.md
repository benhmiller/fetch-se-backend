# Fetch Rewards Challenge - Backend Software Engineering
Backend REST API web service that accepts HTTP requests and returns responses based on Fetch Backend Internship Challenge specifications.

## Premise
* There exists a `user` that possesses `points` in their account from various `payers`.
* A `payer` is the producer of the item that points were added through
* Each transaction denotes a `payer`, `points` associated, and a `timestamp`.
  * Transactions are stored on the backend.
  * Points associated with a `payer` may never be less than 0.
* A user may `spend` accumulated points.
  * A user may never spend more points than they have accumulated.
  * Points are spent according to oldest timestamped transactions first.

## Dependencies/Tools
* [Node](https://nodejs.org/) - Open-source, cross-platform JavaScript runtime environment
* [Express](https://expressjs.com/) - Back end Node.js server framework for building web apps and APIs
* [Express-Validator](https://express-validator.github.io/docs/) - Express.js middleware library for server-side data validation
* [Mocha](https://mochajs.org/) - JavaScript testing framework that runs on Node.js and in the browser
* [Chai](https://www.chaijs.com/) - Test asseertion library for Node.js and the browser
* [Chai HTTP](https://www.npmjs.com/package/chai-http) - Chai plugin for testing RESTful APIs


## Getting Started
1) Clone repo locally
    ```
    git clone https://github.com/benhmiller/fetch-se-backend.git
    ```
2) Go to the project's root directory
    ```
    cd /my/path/to/fetch-se-backend
    ```
3) Install dependencies
    ```
    npm install
    ```
4) Start the server
    ```
    npm start
    ```
    Your terminal should read:
    ```
    Server running on port: http://localhost:8000
    ```
5) Verify the app is running by visiting http://localhost:8000. You should see the following greeting:  
    ```
    "Welcome, please refer to the README.md for further instructions."
    ```

## Making API calls
We will be using **Postman** to make calls to the API.  
* Go to the [Postman](https://www.postman.com/) site.
* Create an account or log in.
* From your acount's home screen, create or use an existing `Workspace` by clicking on `Workspace` in the top left menu bar.
* Once you're in a workspace, click `...` and select `Add a request`.
* Your screen should look like the image below.
>![Postman screen](/assets/images/postman-1.png)
* Now, let us begin by adding transactions

## POST Route "/add" - Add Payer Transaction
***REQUEST BODY FORMAT*** 
```
{"payer": <str>, "points": <int>, "timestamp": <ISO8601>}
```
* Ensure the request type is set to `POST`.
* Enter the server port with the `/add` endpoint.
![Postman screen with endpoint specification](/assets/images/postman-2.png)
* Under the URL, select `Body`, check the `raw` radio button, and select `JSON` from the dropdown.
* Enter a valid request body such as the one shown below:
>![Example JSON '/add' format](/assets/images/JSON-add-example.png)
* Click `Send` and you should receive a `Status: 200 OK` response in the body section.

### POST route "/add" Errors
* A `Status: 400 Invalid Request Body` error response will occur if a request body is sent in the wrong format:
  * More or less than three keys
  * Missing required keys
* A `Status: 401 Invalid Points` error response will occur if:
  * Point parameter is not a non-zero integer
  * Point value will cause payer points to become less than 0
* A `Status: 402 Invalid Timestamp` error response will occur if:
  * Timestamp parameter is not a valid JSON formatted date

**NOTE:** In the case of a transaction being added with a negative `points` amount, the endpoint will first verify the negative
amount will not cause the `payer` to have less than zero `points`. Then, the negative points will be subtracted from other transactions by that `payer` from oldest to newest. If one seeks to observe the entire transaction history, these negative transactions will be tracked (as per the project specification). A separate data structure is employed to track `payer` points available to be spent by the `user`.

## POST route "/spend" - Spend User Points
***REQUEST BODY FORMAT***
```
{"points": <str>}
```
* Ensure the request type is set to `POST`.
* Enter the server port with the `/spend` endpoint.
* Under the URL, select `Body` and  check the `raw` radio button and select `JSON` from the dropdown.
* Enter a valid request body in the section below.
* Click  `Send` and, if the user has enough points, you'll receive a `Status: 200 OK` response in the body section below along with a list showing how many points were spend from each `payer`.
>![Example '/spend' output](/assets/images/postman-3.png)
* The response above is the result of sending sending `{"points": 5000}` to `"/points/spend'` after the following transactions have been added by payers:
  ```
  { "payer": "DANNON", "points": 300, "timestamp": "2022-10-31T10:00:00Z" }
  { "payer": "UNILEVER", "points": 200, "timestamp": "2022-10-31T11:00:00Z" }
  { "payer": "DANNON", "points": -200, "timestamp": "2022-10-31T15:00:00Z" }
  { "payer": "MILLER COORS", "points": 10000, "timestamp": "2022-11-01T14:00:00Z" }
  { "payer": "DANNON", "points": 1000, "timestamp": "2022-11-02T14:00:00Z" }
  ```

### POST route "/points/spend" Errors
* A `Status: 400 Invalid Request Body` error response will occur if a request body is sent in the wrong format:
  * More or less than one key
  * Missing the required key
* A `Status: 401 Invalid Points` error response will occur if:
  * Point parameter is not an integer
  * Point parameter exceeds the current point balance of the user
  * Point parameter is less than or equal to zero

## GET route "/balance" - Get Points Available Per Payer
* This route gives the user their remaining available `points` per `payer`.
>![Example '/balance' output](/assets/images/postman-4.png)

## Running Tests
Run tests in [test.js](test/test.js) from the project's main directory:
```
npm test
```
Tests check that the app should:
* `POST` a new transaction
* NOT `POST` a new transaction with incorrect request body
* `GET` all points by payer
* `POST` spend points available
* NOT `POST` spend an unavailable amount of points
* NOT `POST` transaction with negative points if it would make the payer's points go negative
* `POST` transactions with negative points if payer has enough points to cover the negative amount