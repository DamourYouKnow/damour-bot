module.exports = function(bot, config) {
    bot.event.memberAdd((member) => {
        if (config.joinRole) {
            const role = member.guild.roles.find((role) => {
                role.name == config.joinRole;
            });
            if (role) member.addRole(role);
        }
    });
};
