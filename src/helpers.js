
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const config = yaml.safeLoad(
    fs.readFileSync(path.resolve(__dirname, '../config.yml'))
);

module.exports = {};


module.exports.messageHandler = function(commands, message) {
    if (message.content.startsWith(config.commandPrefix)) {
        const command = message.content.substring(config.commandPrefix.length)
            .split(' ')[0];
        if (commands.exists(command)) {
            const args = message.content.split(' ').slice(1);
            commands.execute(command, message, args);
        }
    }
};

module.exports.readJson = function(filename, callback) {
    fs.readFile(filename, 'utf8', function(err, data) {
        if (err) callback(err);
        callback(err, JSON.parse(data));
    });
};
