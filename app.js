var Discord = require('discord.js');
var fs = require('fs');
var welcomes = require('./welcomes.js');
var goodbyes = require('./goodbyes.js')

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

var client = new Discord.Client();
var recent = {};

class Commands {
    constructor() {
        this.commands = { };
    }

    add(command, handler) {
        this.commands[command] = handler;
    }

    exists(command) {
        return command in this.commands;
    }

    execute(command, message) {
        this.commands[command](message);
    }
}

var commands = new Commands();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('guildMemberAdd', member => {
    let channel = member.guild.channels.find(ch => ch.name == 'general');
    let username = member.user.username;
    if (channel) {
        channel.send(choice(welcomes).replaceAll("{user}", `**${username}**`));   
    }
    recent[member.id] = new Date();
    setTimeout(() => {delete recent[member.id];} , 1000 * 60 * 10);
});

client.on('guildMemberRemove', member => {
    if (member.id in recent) {
        let username = member.user.username;
        let channel = member.guild.channels.find(ch => ch.name == 'general');
        let delta = new Date(new Date() - recent[member.id]);
        let minutes = delta.getMinutes();
        let seconds = delta.getSeconds();
        let msg = choice(goodbyes).replaceAll("{user}", `**${username}**`);
        msg += "\n\n";
        msg += `They departed after ${minutes} minutes and ${seconds} seconds.`;
        channel.send(msg);   
    }
});

commands.add('welcome', message => {
    let username = message.author.username;
    message.channel.send(
            choice(welcomes).replaceAll("{user}", `**${username}**`));
});

commands.add('goodbye', message => {
    let username = message.author.username;
    message.channel.send(
            choice(goodbyes).replaceAll("{user}", `**${username}**`));
});

client.on('message', message => {
    if (message.content.startsWith("!")) {
        let command = message.content.substring(1).split(" ")[0];
        if (commands.exists(command)) commands.execute(command, message);
    }
});

readJson('auth.json', (err, auth) => {
    client.login(auth.token);
});

function readJson(filename, callback) {
    fs.readFile(filename, 'utf8', function(err, data) {
        if (err) callback(err);
        callback(err, JSON.parse(data));
    });
}

function choice(array) {
    return array[Math.floor(Math.random() * array.length)];
}