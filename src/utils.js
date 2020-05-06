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
}
