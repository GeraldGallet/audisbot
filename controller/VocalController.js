// controllers/VocalController.js
const log = require('better-logs')('VocalController');
const fs = require('fs');
const ytdl = require('ytdl-core');
const converter = require('video-converter');
const MP3Cutter = require('mp3-cutter');
const discordTTS = require("discord-tts");

const changeableOptions = ['volume', 'description'];

class VocalController {
    constructor(rules, emitter, basePath) {
        this.rules = rules;
        this.emitter = emitter;
        this.basePath = basePath + 'files\\';

        this.currentDispatcher = null;
        this.currentVoiceConnection = null;
        this.currentChannel = null;
        this.disconnectTimeout = null;
    }

    init() {
        this.emitter.emit('ready', 'Vocal controller ready');
    }

    /* ========== Managing commands ========== */

    /**
     * List all commands and their options
     * @returns {string}
     */
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

    /**
     * Add a new custom vocal command
     * @param message ['addvocal', <command name>, <command type>, <option>]
     * @returns {string|number}
     */
    addCommand(message) {
        const newCommand = {
            "command": message[1],
            "description": 'No description here',
            "type": message[2],
        };

        if (newCommand.type === 'tts') {
            newCommand.audio = '';
            for (let i = 3; i < message.length; i += 1) {
                newCommand.audio += `${message[i]} `;
            }
        } else if (newCommand.type === 'mp3' || newCommand.type === 'link') {
            newCommand.audio = message[3];
            newCommand.description = '';
            for (let i = 3; i < message.length; i += 1) {
                newCommand.description += `${message[i]} `;
            }
        } else {
            return `Unknown vocal type '${message[1]}'`;
        }

        this.rules.commands.push(newCommand);
        return 0;
    }

    /**
     * Change an option of a command
     * @param message
     * @returns {string}
     */
    setOption(message) {
        if (!changeableOptions.includes(message[1])) {
            return `Specified option '${message[2]}' can't be changed`;
        }

        for (let i = 0; i < this.rules.commands.length; i += 1) {
            if (this.rules.commands[i].command === message[1]) {
                let value = '';
                for (let j = 3; j < message.length; j += 1) {
                    value += message[j];
                    if (j !== message.length - 1) {
                        value += ' ';
                    }
                }

                this.rules.commands[i][message[2]] = value;
                return `Successfully set ${message[2]} of command ${message[1]} to '${value}'`;
            }
        }

        return `Command '${message[1]}' not found`;
    }

    /**
     * Get the saved command
     * @param command
     * @returns {null|{description: string, command: string}}
     */
    getRule(command) {
        for (let i = 0; i < this.rules.commands.length; i += 1) {
            if (this.rules.commands[i].command === command) {
                return this.rules.commands[i];
            }
        }

        return null;
    }


    /* ========== Managing the vocal ========== */

    /**
     * Tells if we are currently playing something
     * @returns {boolean}
     */
    isPlaying() {
        if (this.currentDispatcher !== null) {
            return this.currentDispatcher.paused;
        }
        return false;
    }

    /**
     * Dispatchs the audio stream to our current channel
     * @param audio
     * @param volume
     */
    play(audio, volume = 0.5) {
        log.debug(`Playing at volume ${volume}`);
        if (this.currentDispatcher === null) {
            log.debug('We are not playing anything on channel we are on');
            this.currentDispatcher = this.currentVoiceConnection.play(audio, { volume: volume });
        } else {
            log.debug('We are already playing something');
            if (this.queuing) {
                log.debug('Queuing activated, adding to queue');
            } else {
                log.debug('Queuing not activated, bypassing and playing');
                this.currentDispatcher = this.currentVoiceConnection.play(audio, { volume: volume });
            }
        }

        this.currentDispatcher.on('finish', () => {
            this.musicOver();
        });
    }

    /**
     * Resume the play
     * @param messageObject
     */
    resume(messageObject) {
        if (this.currentDispatcher === null) {
            messageObject.reply('I\'m not even doing anything');
            return;
        }

        if (this.currentVoiceConnection.channel.id !== messageObject.member.voice.channel.id) {
            messageObject.reply('You must be in the same channel as me to do this');
            return;
        }

        this.currentDispatcher.resume();
    }

    /**
     * Pause the play
     * @param messageObject
     */
    pause(messageObject) {
        if (this.currentDispatcher === null) {
            messageObject.reply('I\'m not doing anything');
            return;
        }

        if (this.currentVoiceConnection.channel.id !== messageObject.member.voice.channel.id) {
            messageObject.reply('You must be in the same channel as me to do this');
            return;
        }

        this.currentDispatcher.pause();
    }

    /**
     * Stop the play and leave the channel
     * @param messageObject
     */
    stop(messageObject) {
        if (this.currentVoiceConnection.channel.id !== messageObject.member.voice.channel.id) {
            messageObject.reply('You must be in the same channel as me to do this');
            return;
        }

        if (this.currentDispatcher !== null) {
            this.leaveChannel();
        } else {
            messageObject.reply('I\'m not doing anything');
        }
    }


    /**
     * Computes a command
     * @param messageObject
     * @param message
     */
    command(messageObject, message) {
        const command = this.getRule(message[0]);

        if (command !== null) {
            const authorChannel = messageObject.member.voice.channel;

            if (!authorChannel) {
                messageObject.reply('You must be in a vocal channel for this to work');
                return;
            }

            this.computePlay(authorChannel, command, null, message);
        } else {
            log.info(`Unknown vocal command: ${message[0]}`);
        }
    }

    /**
     * Manages connection to a vocal channel
     * @param channel
     * @returns {Promise<unknown>}
     */
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

    /**
     * Computes a command to play
     * @param channel: the channel on which to play it
     * @param command: the command object
     * @param wantedVolume: if we want a precise volume
     * @param message: if we need the content of the user's message
     * @returns {void}
     */
    computePlay(channel, command, wantedVolume = null, message = null) {
        clearTimeout(this.disconnectTimeout);
        let audio = null;

        switch (command.type) {
            case 'mp3':
                log.debug(`Playing file ${command.audio}`)
                audio = `${this.basePath}${command.audio}`;
                break;

            case 'link':
                log.debug(`Playing YouTube video ${command.audio}`);
                audio = ytdl(command.audio, { 'filter': 'audioonly' });
                break;

            case 'tts':
                let sentence = '';
                if (!command.audio) {
                    for (let j = 1; j < message.length; j += 1) {
                        sentence += message[j];
                        sentence += ' ';
                    }
                } else {
                    sentence = command.audio;
                }

                log.debug(`Saying sentence '${sentence}'`);
                audio = discordTTS.getVoiceStream(sentence, 'fr-FR');
        }

        let volume = 0.5;
        if (wantedVolume !== null) {
            volume = wantedVolume;
        } else {
            if (command.volume) volume = command.volume;
        }

        this.connect(channel).then((connection) => {
            this.currentChannel = channel;
            this.currentVoiceConnection = connection;

            this.play(audio, +volume);
        });
    }



    /**
     * Leave a channel and reset all variables
     */
    leaveChannel() {
        log.debug('Leaving vocal channel');
        this.currentChannel.leave();
        this.currentChannel = null;
        this.currentVoiceConnection = null;
        this.currentDispatcher = null;
        clearTimeout(this.disconnectTimeout);
    }

    /**
     * Actions to perform once the play is finished (leaving channel ...)
     */
    musicOver() {
        log.debug('Playing is over, getting ready to leave');
        this.disconnectTimeout = setTimeout(() => {
            this.leaveChannel();
        }, 1000 * 60 * 10);
    }

    /**
     * Download a YouTube video into a mp3 file
     * @param message
     */
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
}

module.exports = VocalController;
