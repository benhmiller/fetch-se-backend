class TransactionNode {
    constructor(transaction) {
      this.transaction = transaction;
      this.next = null;
    }
  }
  
class TransactionList {
    constructor() {
      this.head = null;
      this.tail = null;
    }

    addTransaction(transaction) {
      const newNode = new TransactionNode(transaction);

      // Account for adding to empty list
      if (!this.head) {
        this.head = newNode;
        this.tail = newNode;
        return;
      }
  
      // Insert in sorted order by timestamp
      if (transaction.timestamp < this.head.transaction.timestamp) { // Insert at head
        newNode.next = this.head;
        this.head = newNode;
      }
      else {
        let prevNode = null;
        let currentNode = this.head;
  
        // Find the appropriate position to insert
        while (currentNode && transaction.timestamp >= currentNode.transaction.timestamp) {
          prevNode = currentNode;
          currentNode = currentNode.next;
        }
  
        // Insert before current
        prevNode.next = newNode;
        newNode.next = currentNode;
  
        if (!currentNode) { // Update tail if inserting at the end
          this.tail = newNode;
        }
      }
    }

    peekHead() {
        if (!this.head) {
            return null;
        }
        return this.head.transaction;
    }

    removeHead() {
        if (!this.head) {
          return null;
        }
    
        const removedTransaction = this.head.transaction;
        this.head = this.head.next;
    
        if (!this.head) { // If list now empty, set tail to null
          this.tail = null;
        }
    
        return removedTransaction;
      }
  }
  
  module.exports = {
    TransactionNode,
    TransactionList
  };