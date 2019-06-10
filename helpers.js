
const fs = require('fs');
const yaml = require('js-yaml');

const config = yaml.safeLoad(fs.readFileSync('config.yml'));

module.exports = {};

module.exports.Commands = class {
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
};

module.exports.messageHandler = function(commands, message) {
    if (message.content.startsWith(config.commandPrefix)) {
        const command = message.content.substring(config.commandPrefix.length)
            .split(' ')[0];
        if (commands.exists(command)) {
            const args = message.content.split(' ').slice(1);
            commands.execute(command, message, args);
        }
    }
};

module.exports.login = function(client) {
    const token = process.env.DISCORD_API_TOKEN || config.token;
    if (token) {
        client.login(token);
    } else {
        console.log('No token provided in environment variables or config.yml');
    }
};

module.exports.findChannel = function(guild, channelName) {
    return guild.channels.find((ch) => ch.name == channelName);
};

module.exports.send = function(channel, content) {
    channel.send(content).catch((err) => console.log(err));
};

module.exports.readJson = function(filename, callback) {
    fs.readFile(filename, 'utf8', function(err, data) {
        if (err) callback(err);
        callback(err, JSON.parse(data));
    });
};
