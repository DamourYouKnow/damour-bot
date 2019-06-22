const request = require('request');
const cheerio = require('cheerio');

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

module.exports.fact = function(callback, month, day) {
    let date = new Date();
    if (month != undefined && day != undefined) {
        if (month.length == 0) {
            callback(Error('No month provided!'));
            return;
        }
        month = upper(month);
        const i = months.indexOf(month);
        if (i == -1) {
            callback(Error('Invalid month!'));
            return;
        }
        if (isNaN(day)) {
            callback(Error('Invalid day!'));
            return;
        }
        day = Number(day);
        date = new Date(2000, i, day);
    }

    request(`${wikiUrl}/${wikiDate(date)}`, (err, resp, body) => {
        if (err) {
            callback(err);
            return;
        }

        try {
            const $ = cheerio.load(body);
            const eventList = $('#Events').parent().next().find('li').toArray();
            const fact = {
                'date': `${months[date.getMonth()]} ${date.getDate()}`,
                'fact': $(choice(eventList)).text()
            };
            callback(null, fact);
        } catch (err) {
            callback(err);
        }
    });
};

function wikiDate(date) {
    return `${months[date.getMonth()]}_${date.getDate()}`;
}

function choice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function upper(word) {
    return `${word[0].toUpperCase()}${word.substring(1)}`;
}
