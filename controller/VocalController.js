// controllers/VocalController.js
const log = require('better-logs')('VocalController');
const fs = require('fs');
const ytdl = require('ytdl-core');
const converter = require('video-converter');
const MP3Cutter = require('mp3-cutter');
// const ytdl = require('ytdl-core-discord');

const changeableOptions = ['volume', 'description'];

class VocalController {
    constructor(rules, emitter, basePath) {
        this.rules = rules;
        this.emitter = emitter;
        this.basePath = basePath + 'files\\';
        this.queuing = false;

        this.currentDispatcher = null;
        this.currentVoiceConnection = null;
        this.currentChannel = null;
        this.disconnectTimeout = null;
    }

    isPlaying() {
        if (this.currentDispatcher !== null) {
            return this.currentDispatcher.paused;
        }
        return false;
    }

    setQueuing(queuing) {
        this.queuing = queuing;
    }

    init() {
        this.emitter.emit('ready', 'Voilà, équipé');
    }

    list() {
        let message = '=== Vocal commands ===\n';
        message += `(${this.rules.description})\n`;
        for (let i = 0; i < this.rules.commands.length; i += 1) {
            message += `${this.rules.commands[i].command}\t|\t${this.rules.commands[i].description}`;
            if (this.rules.commands[i].volume) {
                message += `\t|\tvolume : ${this.rules.commands[i].volume}`;
            }
            message += '\n';
        }

        return message + '\n';
    }

    getRule(command) {
        for (let i = 0; i < this.rules.commands.length; i += 1) {
            if (this.rules.commands[i].command === command) {
                return this.rules.commands[i];
            }
        }

        return null;
    }

    compute(messageObject, message) {
        const command = this.getRule(message[0]);

        if (command !== null) {
            if (message[1] === 'help') {
                const help = `=== ${message[0]}'s help ===\n${command.help ? command.help : 'There is no help for this command :( write one with describe command !'}`;
                messageObject.channel.send(help);
                return;
            }
            const authorChannel = messageObject.member.voice.channel;

            if (!authorChannel) {
                messageObject.reply('You are not in a voice channel tête de fiac');
                return;
            }

            this.computePlay(authorChannel, command);
        } else {
            log.info(`Unknown vocal command: ${message[0]}`);
        }
    }

    async connect(channel) {
        if (this.currentChannel === null || (this.currentChannel.id !== channel.id)) {
            log.debug(`Not connected to channel ${channel.name}, connecting`);
            this.currentDispatcher = null;
            // TODO : reset the queue if we are currently using one
            return await channel.join();
        } else {
            log.debug(`Already connected to channel ${channel.name}`);
            return new Promise((resolve, reject) => { resolve(this.currentVoiceConnection)});
        }
    }

    async computePlay(channel, command, wantedVolume = null) {
        clearTimeout(this.disconnectTimeout);
        let audio = null;

        switch (command.type) {
            case 'mp3':
                audio = `${this.basePath}${command.audio}`;
                break;

            case 'link':
                // Adding options
                audio = ytdl(command.audio, { 'filter': 'audioonly' });
                break;
        }

        let volume = 0.5;
        if (wantedVolume !== null) {
            volume = wantedVolume;
        } else {
            if (command.volume) volume = command.volume;
        }

        // Checking if we are already in channel
        this.connect(channel).then((connection) => {
            this.currentChannel = channel;
            this.currentVoiceConnection = connection;

            this.play(audio, +volume);
        });
    }

    play(audio, volume = 0.5) {
        log.debug(`Playing at volume ${volume}`);
        if (this.currentDispatcher === null) {
            // We are not playing anything
            log.debug('We are not playing anything on channel we are on');
            this.currentDispatcher = this.currentVoiceConnection.play(audio, { volume: volume });
        } else {
            log.debug('We are already playing something');
            // We are already playing something
            if (this.queuing) {
                log.debug('Queuing activated, adding to queue');
            } else {
                log.debug('Queuing not activated, bypassing and playing');
                this.currentDispatcher = this.currentVoiceConnection.play(audio, { volume: volume });
            }
        }

        // Gérer la fin
        this.currentDispatcher.on('finish', () => {
            this.musicOver();
        });
    }

    resume(messageObject) {
        if (this.currentDispatcher === null) {
            messageObject.reply('I\'m not doing anything you Jean-foutre');
            return;
        }

        if (this.currentVoiceConnection.channel.id !== messageObject.member.voice.channel.id) {
            messageObject.reply('J\'te parle pas toi');
            return;
        }

        this.currentDispatcher.resume();
    }

    pause(messageObject) {
        if (this.currentDispatcher === null) {
            messageObject.reply('I\'m not doing anything you Jean-foutre');
            return;
        }

        if (this.currentVoiceConnection.channel.id !== messageObject.member.voice.channel.id) {
            messageObject.reply('J\'te parle pas toi');
            return;
        }

        this.currentDispatcher.pause();
    }

    stop(messageObject) {
        if (this.currentVoiceConnection.channel.id !== messageObject.member.voice.channel.id) {
            messageObject.reply('J\'te parle pas toi');
            return;
        }

        if (this.currentDispatcher !== null) {
            this.leaveChannel();
        } else {
            messageObject.reply('I\'m not doing anything you Jean-foutre');
        }
    }

    leaveChannel() {
        this.currentChannel.leave();
        this.currentChannel = null;
        this.currentVoiceConnection = null;
        this.currentDispatcher = null;
        clearTimeout(this.disconnectTimeout);
    }

    musicOver() {
        log.debug('Playing is over, what should we do ?');
        if (this.queuing) {
            log.debug('Queuing, seeing what\'s next (nope) OR getting ready to leave');
            this.disconnectTimeout = setTimeout(() => {
                this.leaveChannel();
            }, 1000 * 60 * 10);
        } else {
            log.debug('Not queuing, getting ready to leave');
            this.disconnectTimeout = setTimeout(() => {
                this.leaveChannel();
            }, 1000 * 60 * 10);
        }
    }

    download(message) {
        const link = message[1];
        const name = message[2];
        let start = null;
        let end = null;

        // Download
        const options = {
            'filter': 'audioonly'
        };

        if (message.length > 3) {
            start = message[3];
        }

        if (message.length > 4) {
            end = message[4];
        }

        const tmpFLV = `${this.basePath}${name}_tmp.flv`;
        const tmpMP3 = `${this.basePath}${name}_tmp.mp3`;
        const finalMP3 = `${this.basePath}${name}.mp3`
        const download = ytdl(link, options);
        const writeStream = fs.createWriteStream(tmpFLV);

        download.pipe(writeStream);

    //     download.on('progress', (chunkLength, currentChunks, totalChunks) => {
    //         log.info(`Downloaded ${currentChunks} / ${totalChunks}`);
    //     });

        writeStream.on('finish', () => {
            log.debug(`Finished downloading ${name}_tmp.flv`);
            // Convert
            converter.convert(tmpFLV, tmpMP3, function(err) {
                if (err) throw err;
                log.debug(`Converted ${name}_tmp.flv to ${name}.mp3`);

                // Cut
                MP3Cutter.cut({
                    src: tmpMP3,
                    target: finalMP3,
                    start: +start,
                    end: +end
                });

                fs.unlink(tmpFLV, (err) => {
                    if (err) {
                        log.error(err);
                    }
                });

                fs.unlink(tmpMP3, (err) => {
                    if (err) {
                        log.error(err);
                    }
                });
            });
        });
    }

    addCommand(message) {
        const newCommand = {
                "command": message[1],
                "description": message.length > 4 ? message[4] : 'No description here',
                "type": message[2],
                "audio": message[3],
        };

        this.rules.commands.push(newCommand);

        return `Command '${newCommand.command}' successfully added !`;
    }

    setOption(message) {
        if (!changeableOptions.includes('volume')) {
            return 'This option can\'t be changed gredin';
        }

        for (let i = 0; i < this.rules.commands.length; i += 1) {
            if (this.rules.commands[i].command === message[1]) {
                let value = '';
                for (let j = 3; j < message.length; j += 1) {
                    value += message[j];
                    value += ' ';
                }

                this.rules.commands[i][message[2]] = value;
                return `Successfully set ${message[2]} of command ${message[1]} to '${value}'`;
            }
        }

        return 'Command not found';
    }
}

module.exports = VocalController;
