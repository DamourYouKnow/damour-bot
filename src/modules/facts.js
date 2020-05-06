const http = require('axios');
const cheerio = require('cheerio');
const utils = require('../utils');

module.exports = function(bot) {
    bot.commands.add({'name': 'fact'}, async (message, month, day) => {
        try {
            const fact = await getFact(month, day);
            await bot.send(message.channel, bot.embed({
                title: `Fact about ${fact.date}`,
                description: fact.fact,
                url: `${fact.source}`,
                footer: `Source: ${fact.source}`
            }));
        } catch (err) {
            await bot.send(message.channel, err.message);
        }
    });
};

const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];

const wikiUrl = 'https://en.wikipedia.org/wiki';

async function getFact(month, day) {
    let date = new Date();
    if (month != undefined && day != undefined) {
        if (month.length == 0) throw Error('No month provided!');
        month = upper(month);
        const i = months.indexOf(month);
        if (i == -1) throw Error('Invalid month!');
        if (isNaN(day)) throw Error('Invalid day!');
        day = Number(day);
        date = new Date(2000, i, day);
    }

    const url = `${wikiUrl}/${wikiDate(date)}`;
    const response = await http.get(url);
    const $ = cheerio.load(response.data);
    const eventList = $('#Events').parent().nextUntil('h2')
        .filter('ul').find('li').toArray();
    return {
        date: `${months[date.getMonth()]} ${date.getDate()}`,
        fact: $(utils.choice(eventList)).text(),
        source: url
    };
}

function wikiDate(date) {
    return `${months[date.getMonth()]}_${date.getDate()}`;
}

function upper(word) {
    return `${word[0].toUpperCase()}${word.substring(1)}`;
}

