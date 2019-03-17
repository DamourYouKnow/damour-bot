var Discord = require('discord.js');
var fs = require('fs');
var welcomes = require('./welcomes.js');
var goodbyes = require('./goodbyes.js');
var yaml = require('js-yaml');

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

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

var client = new Discord.Client();
var recent = {};
var commands = new Commands();
var config = yaml.safeLoad(fs.readFileSync("config.yml"));

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('guildMemberAdd', member => {
    if (config.welcomeChannel) {
        // Post welcome message.
        let channel = member.guild.channels.find(
                ch => ch.name == config.welcomeChannel);
        if (channel) sendWelcome(channel, member.user);
    }

    if (config.joinRole) {
        member.addRole(
                member.guild.roles.find(role => role.name == config.joinRole));
    }
});

client.on('guildMemberRemove', member => {
    if (config.goodbyeChannel) {
        let channel = member.guild.channels.find(
            ch => ch.name == config.goodbyeChannel);

        if (channel) sendGoodbye(channel, member.user, true);
    }
});

function sendWelcome(channel, user) {
    let username = user.username;
    let embed = new Discord.RichEmbed();
    embed.setTitle("New member!");
    embed.setThumbnail(user.avatarURL);
    embed.setColor(0x3380ff);
    embed.setDescription(
            choice(welcomes).replaceAll("{user}", `**${username}**`));
    channel.send({embed}); 
    
    // Set timeout for goodbye message.
    recent[user.id] = new Timer().start();
    setTimeout(() => {delete recent[user.id];} , 1000 * 60 * 10);
}

function sendGoodbye(channel, user, postTime) {
    let username = user.username;
    let embed = new Discord.RichEmbed();
    embed.setTitle("Member left");
    embed.setThumbnail(user.avatarURL);
    embed.setColor(0xff9633);
    embed.setDescription(
            choice(goodbyes).replaceAll("{user}", `**${username}**`));

    let ttl;
    if (user.id in recent) {
        let time = timeStr(recent[user.id].end());
        ttl = `They departed after ${time}`;
    }  
    if (ttl && postTime) embed.setFooter(ttl);

    channel.send({embed});
}

commands.add({'name': "welcome"}, message => {
    sendWelcome(message.channel, message.author);
});

commands.add({'name': "goodbye"}, message => {
    sendGoodbye(message.channel, message.author, true);
});

if (config.colorPrefix) {
    commands.add({'name': "color", 'aliases': ["colour"]}, cmdColor);
    commands.add({'name': "colors", 'aliases': ["colours"]}, cmdColors);
}

function cmdColor(message, args) {
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

    let colorRoles = roles.filter(
            role => role.name.startsWith(config.colorPrefix));

    let colors = colorRoles.map(role => role.name.split(config.colorPrefix)[1]);

    let found = colors.includes(args[0]);
    if (!found) {
        message.channel.send("Color role does not exist.");
        return;
    }

    let colorRole = colorRoles.find(
            role => role.name == config.colorPrefix + args[0])

    if (!colorRole) {
        message.channel.send(
                `Color role ${config.colorPrefix}${args[0]} does not exist.`);
        return;     
    }

    // Remove existing color roles if one exists.
    let userRoles = member.roles.array();
    let exists = userRoles.filter(
            role => role.name.startsWith(config.colorPrefix));
    let rem = exists.map(role => role.id);
    member.removeRoles(rem, "Removed color").then(function() {
        // Add new color role.
        member.addRole(colorRole.id, "Added color").then(function() {
            message.channel.send(`Assigned color ${args[0]}.`);
        }); 
    });
}

function cmdColors(message) {
    let roles = message.guild.roles.array();
    let colorRoles = roles.filter(
            role => role.name.startsWith(config.colorPrefix));
    let lines = colorRoles.map(role => {
        return `${role.name.split(config.colorPrefix)[1]} - <@&${role.id}>` 
    });
    message.channel.send(`**__Colors available:__**\n${lines.join("\n")}`); 
}

client.on('message', message => {
    if (message.content.startsWith(config.commandPrefix)) {
        let command = message.content.substring(config.commandPrefix.length)
                .split(" ")[0];
        if (commands.exists(command)) {
            let args = message.content.split(' ').slice(1);
            commands.execute(command, message, args);
        }
    }
});


if (config.token) {
    client.login(config.token);
} else {
    readJson('auth.json', (err, auth) => {
        if (err) {
            console.log("No token provided in config.yml or auth.json");
        } else {
            client.login(auth.token);
        }
    });
}

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
    let minutes = time.getMinutes().toString().padStart(2, "0");
    let seconds = time.getSeconds().toString().padStart(2, "0");
    let milliseconds = time.getMilliseconds().toString().padEnd(3, "0");
    return `${minutes}:${seconds}.${milliseconds}`;
}