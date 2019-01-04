var Discord = require('discord.js');
var fs = require('fs');

var client = new Discord.Client();
var messages = [];

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('guildMemberAdd', member => {
    let channel = member.guild.channels.find(ch => ch.name == 'general');
    let username = member.user.username;
    if (channel) {
        channel.send(choice(messages).replace("{user}", `**${username}**`));   
    }
});

client.on('message', message => {
    if (message.content == "!welcome") {
        let username = message.author.username;
        message.channel.send(
                choice(messages).replace("{user}", `**${username}**`));
    }
});

readJson('auth.json', (err, auth) => {
    readJson('messages.json', (err2, data) => {
        messages = data;
        client.login(auth.token);
    });
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