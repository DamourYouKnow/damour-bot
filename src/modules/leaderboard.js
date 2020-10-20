const utils = require('../utils');
const path = require('path');

const filePath = path.resolve(
    __dirname,
    '../../data/channel_leaderboard.json'
);

const channelTimers = {};

module.exports = function(bot) {
    const cmdName = bot.config.leaderboardCommand;
    bot.commands.add({'name': cmdName}, async (message) => {
        const leaderboard = JSON.parse(await utils.readFile(filePath));
        const lines = leaderboard.map((p, i) => {
            const pos = (i+1).toString();
            return `${`${pos}. `.padEnd(4, ' ')}${p.name.padEnd(20, ' ')}`
                + utils.timeStr(new Date(p.time));
        });

        await bot.send(message.channel, bot.embed({
            title: 'Leaderboard',
            color: 0xdec027,
            description: '```' + lines.join('\n\n') + '```'
        }));
    });

    bot.event.voiceStateUpdate(async (oldState, newState) => {
        const server = bot.client.guilds.get(bot.config.server);
        const channel = utils.findChannel(
            server,
            bot.config.leaderboardChannel
        );
        const hasChannel = [oldState, newState].some((state) => {
            return state.voiceChannelID === channel.id;
        });
        if (!hasChannel) return;

        // Add timer to user if new state has channel and timer does not
        // already exist.
        const joined = newState.voiceChannelID === channel.id
            && !(newState.user.id in channelTimers);
        if (joined) {
            channelTimers[newState.user.id] = new utils.Timer().start();
        }

        // Remove timer from user if new state has different channel and a timer
        // exists. Fetch timer value before removing.
        const left = newState.user.id in channelTimers
            && newState.voiceChannelID !== channel.id;
        if (left) {
            const timer = channelTimers[newState.user.id];
            delete channelTimers[newState.user.id];
            timer.end();

            // Add to leaderboard
            const fileExists = await utils.fileExists(filePath);
            if (!fileExists) {
                await utils.writeFile(filePath, '[]');
            }
            let leaderboard = JSON.parse(await utils.readFile(filePath));
            leaderboard.push({
                'name': newState.user.username,
                'time': Number(timer.result())
            });
            leaderboard.sort((a, b) => b.time - a.time);
            leaderboard = leaderboard.slice(0, 20);
            utils.writeFile(filePath, JSON.stringify(leaderboard));

            const textChannel = utils.findChannel(
                bot.client.guilds.get(bot.config.server),
                bot.config.leaderboardTextChannel
            );
            const message = `**${newState.user.username}** spent `
                + `${timer.resultString()} in **${channel.name}**.`;
            await bot.send(textChannel, message);
        }
    });
};
