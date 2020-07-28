class TextController {
    constructor(rules) {
        this.rules = rules;
    }

    /**
     * List all text commands + options
     * @returns {string}
     */
    list() {
        let message = '=== Text commands ===\n';
        message += `(${this.rules.description})\n`;
        for (let i = 0; i < this.rules.commands.length; i += 1) {
            message += `${this.rules.commands[i].command}\t|\t${this.rules.commands[i].description} \n`;
        }

        return message + '\n';
    }

    /**
     * Computes a message and returns the answer
     * @param message: an array of the words of the message
     * @returns {string}
     */
    compute(message) {
        switch (message[0]) {
            case 'ping':
                return 'pong';

            default:
                return 'Unknown commande sale gueux';
        }
    }
}

module.exports = TextController;
