const utils = require('../utils');
const welcomes = require('../messages/welcomes');
const goodbyes = require('../messages/goodbyes');
const bans = require('../messages/bans');

const joinTimers = {};

module.exports = function(bot, config) {
    bot.event.memberAdd((member) => {
        if (config.welcomeChannel) {
            const channel = findChannel(member.guild, config.welcomeChannel);
            if (channel) sendWelcome(bot, channel, member.user);
        }
    });

    bot.event.memberRemove((member) => {
        if (config.goodbyeChannel) {
            const channel = findChannel(member.guild, config.welcomeChannel);
            const recent = member.user.id in joinTimers;
            if (channel && (recent || !config.cutoff)) {
                sendGoodbye(bot, channel, member.user);
            }
        }
    });

    bot.event.memberBan((member) => {
        if (config.goodbyeChannel) {
            const channel = findChannel(member.guild, config.welcomeChannel);
            if (channel) sendBanMessage(bot, channel, member.user);
        }
    });
};

async function sendWelcome(bot, channel, user) {
    const message = utils.choice(welcomes);
    await bot.send(channel, bot.embed({
        title: 'New user!',
        thumbnail: user.avatarURL,
        color: 0x3380ff,
        description: utils.replaceAll(message, '{user}', user.username)
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

    const message = utils.choice(goodbyes)
    const embedConfig = {
        title: 'User left',
        thumbnail: user.avatarURL,
        color: 0xff9633,
        description: utils.replaceAll(message, '{user}', user.username)
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
        description: utils.replaceAll(message, '{user}', user.username)
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
