// ./classes/Queue.js
// Used as a queue for the vocal stuff to play

class Queue {
    constructor() {
        this.commands = [];
    }

    /**
     * Add a command to the queue
     * @param command
     */
    add(command) {

    }

    /**
     * Removes a command from the queue
     * @param index
     */
    remove(index) {

    }

    /**
     * Returns the next command to compute
     */
    next() {

    }

    /**
     * Checks if the queue is empty
     * @returns {boolean}
     */
    isEmpty() {
        return this.commands.length === 0;
    }
}

module.exports = Queue;
