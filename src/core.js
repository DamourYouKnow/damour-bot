const Discord = require('discord.js');

module.exports = {};

class Bot {
    constructor(config) {
        this.config = config;
        this.client = new Discord.Client();
        this.commands = new Commands();

        this.event = {
            ready: (callback) => {
                this.client.on('ready', callback);
            },
            memberAdd: (callback) => {
                this.client.on('guildMemberAdd', callback);
            },
            memberRemove: (callback) => {
                this.client.on('guildMemberRemove', callback);
            },
            memberBan: (callback) => {
                this.client.on('guildBanAdd', callback);
            },
            message: (callback) => {
                this.client.on('message', callback);
            },
            voiceStateUpdate: (callback) => {
                this.client.on('voiceStateUpdate', callback);
            }
        };

        this.event.message((message) => {
            if (message.content.startsWith(this.config.commandPrefix)) {
                const command = message.content.substring(
                    config.commandPrefix.length
                ).split(' ')[0];
                if (this.commands.exists(command)) {
                    const args = message.content.split(' ').slice(1);
                    this.commands.execute(command, message, args);
                }
            }
        });
    }

    addModule(module, config) {
        module(this, config);
    }

    embed(config) {
        const embed = new Discord.RichEmbed();
        if (config.title) embed.setTitle(config.title);
        if (config.thumbnail) embed.setThumbnail(config.thumbnail);
        if (config.color) embed.setColor(config.color);
        if (config.description) embed.setDescription(config.description);
        if (config.footer) embed.setFooter(config.footer);
        if (config.url) embed.setURL(config.url);
        return embed;
    }

    async login() {
        return new Promise((resolve, reject) => {
            const token = process.env.DISCORD_API_TOKEN || this.config.token;
            if (!token) {
                const err = Error(
                    'No token provided in environment variables or config.yml'
                );
                reject(err);
            } else {
                this.client.on('ready', resolve);
                this.client.login(token);
            }
        });
    }

    async send(channel, content) {
        try {
            await channel.send(content);
        } catch (err) {
            console.error(err);
        }
    }
}
module.exports.Bot = Bot;

class Commands {
    constructor() {
        this.commands = { };
    }

    add(command, handler) {
        [command.name, ...command.aliases || []].map((cmd) => {
            this.commands[cmd] = handler;
        });
    }

    exists(command) {
        return command in this.commands;
    }

    execute(command, message, args=[]) {
        this.commands[command].apply(null, [message, ...args]);
    }
}
