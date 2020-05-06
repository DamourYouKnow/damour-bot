const utils = require('../utils');
const welcomes = require('../messages/welcomes');
const goodbyes = require('../messages/goodbyes');
const bans = require('../messages/bans');

const joinTimers = {};

module.exports = function(bot) {
    bot.commands.add({'name': 'welcome'}, (message) => {
        sendWelcome(bot, message.channel, message.author);
    });

    bot.commands.add({'name': 'goodbye'}, (message) => {
        sendGoodbye(bot, message.channel, message.author);
    });

    bot.commands.add({'name': 'ban'}, (message) => {
        sendBanMessage(bot, message.channel, message.author);
    });

    bot.event.memberAdd((member) => {
        if (bot.config.welcomeChannel) {
            const ch = findChannel(member.guild, bot.config.welcomeChannel);
            if (ch) sendWelcome(bot, ch, member.user);
        }
    });

    bot.event.memberRemove((member) => {
        if (bot.config.goodbyeChannel) {
            const ch = findChannel(member.guild, bot.config.welcomeChannel);
            const recent = member.user.id in joinTimers;
            if (ch && (recent || !bot.config.cutoff)) {
                sendGoodbye(bot, ch, member.user);
            }
        }
    });

    bot.event.memberBan((member) => {
        if (bot.config.goodbyeChannel) {
            const ch = findChannel(member.guild, bot.config.welcomeChannel);
            if (ch) sendBanMessage(bot, ch, member.user);
        }
    });
};

async function sendWelcome(bot, channel, user) {
    const message = utils.choice(welcomes);
    await bot.send(channel, bot.embed({
        title: 'New user!',
        thumbnail: user.avatarURL,
        color: 0x3380ff,
        description: utils.replace(message, '{user}', `**${user.username}**`)
    }));

    joinTimers[user.id] = new Timer().start();
    setTimeout(() => {
        delete joinTimers[user.id];
    }, 1000 * 60 * 10);
}

async function sendGoodbye(bot, channel, user) {
    let ttl;
    if (user.id in joinTimers) {
        const time = timeStr(joinTimers[user.id].end());
        ttl = `They departed after ${time}`;
    }

    const message = utils.choice(goodbyes);
    const embedConfig = {
        title: 'User left',
        thumbnail: user.avatarURL,
        color: 0xff9633,
        description: utils.replace(message, '{user}', `**${user.username}**`)
    };
    if (ttl) embedConfig.footer = ttl;

    await bot.send(channel, bot.embed(embedConfig));
}

async function sendBanMessage(bot, channel, user) {
    const message = utils.choice(bans);
    await bot.send(channel, bot.embed({
        title: 'New user!',
        thumbnail: user.avatarURL,
        color: 0xff0000,
        description: utils.replace(message, '{user}', `**${user.username}**`)
    }));
}

function findChannel(guild, channelName) {
    return guild.channels.find((ch) => ch.name == channelName);
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

function timeStr(time) {
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');
    const milliseconds = time.getMilliseconds().toString().padEnd(3, '0');
    return `${minutes}:${seconds}.${milliseconds}`;
}
