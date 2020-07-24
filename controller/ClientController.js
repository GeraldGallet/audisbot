const Discord = require('discord.js');
const log = require('better-logs')('ClientController');
const EventEmitter = require('events');
const fs = require('fs');

const TextController = require('./TextController');
const VocalController = require('./VocalController');
const Queue = require('../classes/Queue');

class VocalEmitter extends EventEmitter {}

class ClientController {
    constructor(config, commands) {
        this.config = config;
        this.commands = commands;
        this.ready = false;
        this.client = new Discord.Client();
        this.vocalEmitter = new VocalEmitter();
        this.welcome = true;

        this.queue = new Queue();
        this.textController = new TextController(this.commands[1]);
        this.vocalController = new VocalController(this.commands[2], this.vocalEmitter, this.config.basePath);
    }

    init() {
        this.client.login(this.config.token).then(() => {
            this.client.user.setActivity(`Try ${this.config.prefix}list`);
        });
        this.client.on('ready', () => {
            log.info(`Logged in as ${this.client.user.tag}!`);
            this.ready = true;
        });

        this.client.on('message',  msg => {
            if (msg.content[0] === this.config.prefix) {
                const message = msg.content.substr(1);
                const splitMessage = message.split(' ');

                switch (this.getTypeOfCommand(splitMessage[0])) {
                    case 'global':
                        log.debug(`${splitMessage[0]} is a global command`);
                        const res = this.computeGlobalCommand(splitMessage, msg);
                        if (res !== null) msg.channel.send(res);
                        break;

                    case 'text':
                        log.debug(`${splitMessage[0]} is a text command`);
                        msg.channel.send(this.textController.compute(splitMessage));
                        break;

                    case 'voice':
                        log.debug(`${splitMessage[0]} is a voice command`);
                        this.vocalController.compute(msg, splitMessage);
                        break;

                    case 'unknown':
                        msg.reply(`Unknown command '${splitMessage[0]}' sale gueux, try '${this.config.prefix}list'`);
                        break;
                }
            }
        });

        this.client.on('voiceStateUpdate', (oldMember, newMember) => {
            const newChannel = newMember.channelID;
            const oldChannel = oldMember.channelID;

            if (newChannel !== null && oldChannel === null) {
                log.debug('Someone entered a channel');
                this.client.channels.fetch(newChannel).then((channel) => {
                    log.debug(`Connected to channel ${channel.name} to say hello`);
                    if (!this.vocalController.isPlaying() && this.welcome) {
                        const command = this.vocalController.getRule('allo');
                        this.vocalController.computePlay(channel, command, 4);
                    }
                }).catch(err => log.error(err));
            }
        });

        this.vocalEmitter.on('ready', (msg) => {
            log.info(`Vocal emitter is ready, he is saying: '${msg}'`);
        });

        this.vocalController.init();
    }

    getTypeOfCommand(command) {
        for (let i = 0; i < this.commands.length; i += 1) {
            for (let j = 0; j < this.commands[i].commands.length; j += 1) {
                if (this.commands[i].commands[j].command === command) {
                    return this.commands[i].title;
                }
            }
        }

        return 'unknown';
    }

    getHelp(command) {
        for (let i = 0; i < this.commands[0].commands.length; i += 1) {
            if (this.commands[0].commands[i].command === command) {
                return this.commands[0].commands[i].help ? this.commands[0].commands[i].help : 'There is no help for this command :( try adding one with describe command !';
            }
        }

        return null;
    }

    computeGlobalCommand(message, messageObject=null) {
        if (message[1] === 'help') {
            return `=== ${message[0]}'s help ===\n` + this.getHelp(message[0]);
        }

        let res;

        switch (message[0]) {
            case 'list':
                log.debug('Listing all commands');
                return this.list();

            case 'pause':
                log.debug('Pausing');
                this.vocalController.pause(messageObject);
                return null;

            case 'resume':
                log.debug('Resuming');
                this.vocalController.resume(messageObject);
                return null;

            case 'stop':
                log.debug('Stopping');
                this.vocalController.stop(messageObject);
                return null;

            case 'download':
                log.debug('Downloading a video');
                this.vocalController.download(message);
                return null;

            case 'files':
                log.debug('Listing files');
                return this.listFiles();

            case 'addvocal':
                log.debug('Adding a new vocal command');
                res = this.vocalController.addCommand(message);
                this.saveCommands();
                return res;

            case 'config':
                log.debug('Showing configuration');
                return this.listConfig();

            case 'toggle':
                log.debug('Toggling a configuration');
                return this.toggleConfig(message);

            case 'setvocal':
                log.debug('Setting an option for a vocal command');
                res = this.vocalController.setOption(message);
                this.saveCommands();
                return res;

            default:
                log.info(`Global command ${message[0]} known but not implemented yet`);
        }
    }

    toggleConfig(message) {
        switch (message[1]) {
            case 'welcome':
                this.welcome = !this.welcome;
                return 'Welcome configuration toggled';

            default:
                return `Unknown configuration '${message[1]}'`;
        }
    }

    list() {
        let message = '=== Global commands ===\n';
        message += `(${this.commands[0].description})\n`;
        for (let i = 0; i < this.commands[0].commands.length; i += 1) {
            message += `${this.commands[0].commands[i].command}\t|\t${this.commands[0].commands[i].description} \n`;
        }

        message += '\n';
        message += this.textController.list();
        message += this.vocalController.list();

        message += '\nTry <command> help if you feel lucky';

        return message;
    }

    listFiles() {
        let message = '=== Audio files ===\n';
        const files = fs.readdirSync(this.vocalController.basePath);

        for (let i = 0; i < files.length; i += 1) {
            message += `- ${files[i]}\n`;
        }
        return message;
    }

    listConfig() {
        let message = '=== My current configuration ===\n';

        message += `- welcome: ${this.welcome}\n`;

        return message;
    }

    saveCommands() {
        const newCommands = this.commands;
        newCommands[1] = this.textController.rules;
        newCommands[2] = this.vocalController.rules;

        fs.writeFile(`${this.config.basePath}commands.js`, `const commands = ${JSON.stringify(newCommands, null, 4)};\n\nmodule.exports = commands;`, function (err) {
            if (err) log.error(err);
            log.debug('New commands saved');
        });
    }
}

module.exports = ClientController;
