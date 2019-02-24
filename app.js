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
        this.commands[command.name] = handler;
        if (command.aliases) {
            for (let alias of command.aliases) {
                this.commands[alias] = handler;
            }
        }
    }

    exists(command) {
        return command in this.commands;
    }

    execute(command, message, args=[]) {
        this.commands[command](message, args);
    }
}

class Timer {
    constructor() {
        this.startTime = null;
        this.endTime = null;
    }

    start() {
        this.startTime = new Date();
        this.endTime = null;
        return this;
    }

    end() {
        this.endTime = new Date();
        return this.result();
    }

    result() {
        return new Date(this.endTime - this.startTime);
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
    recent[member.id] = new Timer().start();
    setTimeout(() => {delete recent[member.id];} , 1000 * 60 * 10);
});

client.on('guildMemberRemove', member => {
    if (member.id in recent) {
        let username = member.user.username;
        let channel = member.guild.channels.find(ch => ch.name == 'general');
        let time = timeStr(recent[member.id].end());
        let msg = choice(goodbyes).replaceAll("{user}", `**${username}**`);
        msg += "\n\n";
        msg += `They departed after \`${time}\`.`;
        channel.send(msg);   
    }
});

commands.add({'name': "welcome"}, message => {
    let username = message.author.username;
    message.channel.send(
            choice(welcomes).replaceAll("{user}", `**${username}**`));
});

commands.add({'name': "goodbye"}, message => {
    let username = message.author.username;
    message.channel.send(
            choice(goodbyes).replaceAll("{user}", `**${username}**`));
});

commands.add({'name': "color", 'aliases': ["colour"]}, (message, args) => {
    let member = message.member;

    if (!member) {
        message.channel.send("Command not executed in guild context.");
        return;       
    }

    if (!args[0]) {
        message.channel.send("You need to specify a color.");
        return;
    }

    let roles = message.guild.roles.array();
    let colorRoles = roles.filter(role => role.name.startsWith("color."));
    let colors = colorRoles.map(role => role.name.split(".")[1]);

    let found = colors.includes(args[0]);
    if (!found) {
        message.channel.send("Color role does not exist.");
        return;
    }

    let colorRole = colorRoles.find(role => role.name == "color." + args[0])

    if (!colorRole) {
        message.channel.send(`Color role color.${args[0]} does not exist.`);
        return;     
    }

    // Remove existing color roles if one exists.
    let userRoles = member.roles.array();
    let exists = userRoles.filter(role => role.name.startsWith("color."));
    let rem = exists.map(role => role.id);
    member.removeRoles(rem, "Removed color").then(function() {
        // Add new color role.
        member.addRole(colorRole.id, "Added color").then(function() {
            message.channel.send(`Assigned color ${args[0]}.`);
        }); 
    });
});

commands.add({'name': "colors", 'aliases': ["colours"]}, (message, args) => {
    let roles = message.guild.roles.array();
    let colorRoles = roles.filter(role => role.name.startsWith("color."));
    let lines = colorRoles.map(role => {
        return `${role.name.split(".")[1]} - <@&${role.id}>` 
    });
    message.channel.send(`**__Colors available:__**\n${lines.join("\n")}`);
});

client.on('message', message => {
    if (message.content.startsWith("!")) {
        let command = message.content.substring(1).split(" ")[0];
        if (commands.exists(command)) {
            let args = message.content.split(' ').slice(1);
            commands.execute(command, message, args);
        }
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

function timeStr(time) {
    let minutes = time.getMinutes().toString().padEnd(2, "0");
    let seconds = time.getSeconds().toString().padEnd(2, "0");
    let milliseconds = time.getMilliseconds().toString().padEnd(3, "0");
    return `${minutes}:${seconds}.${milliseconds}`;
}