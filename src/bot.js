const path = require('path');
const yaml = require('js-yaml');
const utils = require('./utils');

const Bot = require('./core').Bot;
const notifications = require('./modules/notifications');
const roleAssignment = require('./modules/role-assignment');
const facts = require('./modules/facts');

(async function start() {
    const config = yaml.safeLoad(
        await utils.readFile(path.resolve(__dirname, '../config.yml'))
    );
    const bot = new Bot(config);
    bot.addModule(notifications);
    bot.addModule(roleAssignment);
    bot.addModule(facts);
    bot.event.ready(() => console.log(`Logged in as ${bot.client.user.tag}`));
    await bot.login();
})();
