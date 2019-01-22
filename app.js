var Discord = require('discord.js');
var fs = require('fs');

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

var client = new Discord.Client();
var welcomes = [];
var goodbyes = [];

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('guildMemberAdd', member => {
    let channel = member.guild.channels.find(ch => ch.name == 'general');
    let username = member.user.username;
    if (channel) {
        channel.send(choice(welcomes).replace("{user}", `**${username}**`));   
    }
});

client.on('message', message => {
    let username = message.author.username;
    if (message.content == "!welcome") {
        message.channel.send(
                choice(welcomes).replaceAll("{user}", `**${username}**`));
    }
    if (message.content == "!goodbye") {
        message.channel.send(
                choice(goodbyes).replaceAll("{user}", `**${username}**`));
    }
});

readJson('auth.json', (err, auth) => {
    client.login(auth.token);
});
readJson('welcomes.json', (err, data) => { welcomes = data });
readJson('goodbyes.json', (err, data) => { goodbyes = data });

function readJson(filename, callback) {
    fs.readFile(filename, 'utf8', function(err, data) {
        if (err) callback(err);
        callback(err, JSON.parse(data));
    });
}

function choice(array) {
    return array[Math.floor(Math.random() * array.length)];
}