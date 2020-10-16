const util = require('util');
const fs = require('fs');

module.exports = {};

module.exports.choice = function(array) {
    return array[Math.floor(Math.random() * array.length)];
};

module.exports.replace = function(target, search, replacement) {
    return target.split(search).join(replacement);
};

module.exports.readFile = async function(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (err, content) => {
            if (err) reject(err);
            else resolve(content);
        });
    });
};

module.exports.fileExists = async function(path) {
    return new Promise((resolve, reject) => {
        fs.access(path, fs.constants.R_OK, (err) => {
            if (err) resolve(false);
            else resolve(true);
        });
    });
};

module.exports.writeFile = async function(path, content) {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, content, 'utf8', (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

module.exports.findChannel = function(guild, channelName) {
    return guild.channels.find((ch) => ch.name == channelName);
};

module.exports.Timer = class {
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

    resultString() {
        return timeStr(this.result());
    }
};

function timeStr(time) {
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');
    const milliseconds = time.getMilliseconds().toString().padEnd(3, '0');
    return `${minutes}:${seconds}.${milliseconds}`;
}
module.exports.timeStr = timeStr;
