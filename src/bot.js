const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers.js');
const wikiFact = require('./wiki-fact.js');
const welcomes = require('./messages/welcomes.js');
const goodbyes = require('./messages/goodbyes.js');
const banMessages = require('./messages/bans.js');
const yaml = require('js-yaml');

const config = yaml.safeLoad(
    fs.readFileSync(path.resolve(__dirname, '../config.yml'))
);

// eslint-disable-next-line no-extend-native
String.prototype.replaceAll = function(search, replacement) {
    const target = this;
    return target.split(search).join(replacement);
};

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

const client = new Discord.Client();
const recent = {};

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('guildMemberAdd', (member) => {
    if (config.welcomeChannel) {
        // Post welcome message.
        const channel = helpers.findChannel(
            member.guild, config.welcomeChannel);
        if (channel) sendWelcome(channel, member.user);
    }

    if (config.joinRole) {
        member.addRole(
            member.guild.roles.find((role) => role.name == config.joinRole));
    }
});

client.on('guildMemberRemove', (member) => {
    if (config.goodbyeChannel) {
        const channel = helpers.findChannel(
            member.guild, config.welcomeChannel);

        if (channel) sendGoodbye(channel, member.user, true);
    }
});

client.on('guildBanAdd', function(guild, user) {
    if (config.banChannel) {
        const channel = helpers.findChannel(guild, config.banChannel);
        if (channel) sendBanMessage(channel, user);
    }
});

const commands = new helpers.Commands();

commands.add({'name': 'welcome'}, (message) => {
    sendWelcome(message.channel, message.author);
});

commands.add({'name': 'goodbye'}, (message) => {
    sendGoodbye(message.channel, message.author, true);
});

commands.add({'name': 'ban'}, (message) => {
    sendBanMessage(message.channel, message.author);
});

commands.add({'name': 'fact'}, (message, month, day) => {
    wikiFact.fact((err, fact) => {
        if (err) {
            return helpers.send(message.channel, err.message);
        }

        const embed = new Discord.RichEmbed();
        embed.setTitle(`Fact about ${fact.date}`);
        embed.setDescription(fact.fact);
        helpers.send(message.channel, {embed});
    }, month, day);
});

if (config.colorPrefix) {
    commands.add({'name': 'color', 'aliases': ['colour']}, cmdColor);
    commands.add({'name': 'colors', 'aliases': ['colours']}, cmdColors);
}

client.on('message', (message) => {
    helpers.messageHandler(commands, message);
});

helpers.login(client);

function sendWelcome(channel, user) {
    const username = user.username;
    const embed = new Discord.RichEmbed();
    embed.setTitle('New user!');
    embed.setThumbnail(user.avatarURL);
    embed.setColor(0x3380ff);
    embed.setDescription(
        choice(welcomes).replaceAll('{user}', `**${username}**`));
    helpers.send(channel, {embed});

    // Set timeout for goodbye message.
    recent[user.id] = new Timer().start();
    setTimeout(() => {
        delete recent[user.id];
    }, 1000 * 60 * 10);
}

function sendGoodbye(channel, user, postTime) {
    const username = user.username;
    const embed = new Discord.RichEmbed();
    embed.setTitle('User left');
    embed.setThumbnail(user.avatarURL);
    embed.setColor(0xff9633);
    embed.setDescription(
        choice(goodbyes).replaceAll('{user}', `**${username}**`));

    let ttl;
    if (user.id in recent) {
        const time = timeStr(recent[user.id].end());
        ttl = `They departed after ${time}`;
    }
    if (ttl && postTime) embed.setFooter(ttl);

    helpers.send(channel, {embed});
}

function sendBanMessage(channel, user) {
    const username = user.username;
    const embed = new Discord.RichEmbed();
    embed.setTitle('User was banned from the server.');
    embed.setThumbnail(user.avatarURL);
    embed.setColor(0x3380ff);
    embed.setDescription(
        choice(banMessages).replaceAll('{user}', `**${username}**`));
    helpers.send(channel, {embed});
}

function cmdColor(message, newColor) {
    const member = message.member;

    if (!member) {
        helpers.send(message.channel, 'Command not executed in guild context.');
        return;
    }

    if (!newColor) {
        helpers.send(message.channel, 'You need to specify a color.');
        return;
    }

    const roles = message.guild.roles.array();

    const colorRoles = roles.filter(
        (role) => role.name.startsWith(config.colorPrefix));

    const colors = colorRoles.map((role) => {
        return role.name.split(config.colorPrefix)[1];
    });

    const found = colors.includes(newColor);
    if (!found) {
        helpers.send(message.channel, 'Color role does not exist.');
        return;
    }

    const colorRole = colorRoles.find(
        (role) => role.name == config.colorPrefix + newColor);

    if (!colorRole) {
        helpers.send(
            message.channel,
            `Color role ${config.colorPrefix}${newColor} does not exist.`);
        return;
    }

    // Remove existing color roles if one exists.
    const userRoles = member.roles.array();
    const exists = userRoles.filter(
        (role) => role.name.startsWith(config.colorPrefix));
    const rem = exists.map((role) => role.id);
    member.removeRoles(rem, 'Removed color').then(function() {
        // Add new color role.
        member.addRole(colorRole.id, 'Added color').then(function() {
            helpers.send(message.channel, `Assigned color ${newColor}.`);
        });
    });
}

function cmdColors(message) {
    const roles = message.guild.roles.array();
    const colorRoles = roles.filter(
        (role) => role.name.startsWith(config.colorPrefix));
    const lines = colorRoles.map((role) => {
        return `${role.name.split(config.colorPrefix)[1]} - <@&${role.id}>`;
    });

    helpers.send(
        message.channel, `**__Colors available:__**\n${lines.join('\n')}`);
}

function choice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function timeStr(time) {
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');
    const milliseconds = time.getMilliseconds().toString().padEnd(3, '0');
    return `${minutes}:${seconds}.${milliseconds}`;
}

