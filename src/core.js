const Discord = require('discord.js');

module.exports = {};

class Bot {
    constructor(config) {
        this.config = config;
        this.client = new Discord.Client();
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
            guildBanAdd: (callback) => {
                this.client.on('guildBanAdd', callback);
            },
            message: (callback) => {
                this.client.on('message', callback);
            }
        };
    }

    addModule(module, config) {
        module(this, config);
    }

    addCommand(...commands) {
        
    }

    embed(config) {
        const embed = new Discord.RichEmbed();
        if (config.title) embed.setTitle(config.title);
        if (config.thumbnail) embed.setThumbnail(config.thumbnail);
        if (config.title) embed.setTitle(config.title);
        if (config.color) embed.setTitle(config.color);
        if (config.description) embed.setTitle(config.description);
        if (config.footer) embed.setFooter(config.footer);
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
                this.client('ready', resolve);
                this.client.login(token);
            }
        });
    }

    async send(channel, content) {
        await channel.send(content);
    }
}
module.exports.Bot = Bot;

class Command {
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
module.exports.Command = Command;
