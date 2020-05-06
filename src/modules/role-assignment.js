module.exports = function(bot) {
    if (bot.config.colorPrefix) {
        bot.commands.add(
            {'name': 'color', 'aliases': ['colour']},
            (message, color) => cmdColor(bot, message, color));

        bot.commands.add(
            {'name': 'colors', 'aliases': ['colours']},
            (message) => cmdColors(bot, message)
        );
    }

    bot.event.memberAdd((member) => {
        if (bot.config.joinRole) {
            const role = member.guild.roles.find((role) => {
                role.name == bot.config.joinRole;
            });
            if (role) member.addRole(role);
        }
    });
};

async function cmdColor(bot, message, newColor) {
    const member = message.member;

    if (!member) {
        return bot.send(
            message.channel,
            'Command not executed in guild context.'
        );
    }
    if (!newColor) {
        return await bot.send(message.channel, 'No color specified.');
    }

    const roles = message.guild.roles.array();

    const colorRoles = roles.filter(
        (role) => role.name.startsWith(bot.config.colorPrefix)
    );

    const colors = colorRoles.map(
        (role) => role.name.split(bot.config.colorPrefix)[1]
    );

    const found = colors.includes(newColor);
    if (!found) {
        return await bot.send(message.channel, 'Color role does not exist.');
    }

    const colorRole = colorRoles.find(
        (role) => role.name == bot.config.colorPrefix + newColor
    );

    if (!colorRole) {
        return await bot.send(
            message.channel,
            `Color role ${bot.config.colorPrefix}${newColor} does not exist.`
        );
    }

    // Remove existing color roles if one exists.
    const userRoles = member.roles.array();
    const exists = userRoles.filter(
        (role) => role.name.startsWith(bot.config.colorPrefix)
    );
    const rem = exists.map((role) => role.id);
    await member.removeRoles(rem, 'Removed color');
    await member.addRole(colorRole, 'Added color');
    await bot.send(message.channel, `Assigned color ${newColor}.`);
}

async function cmdColors(bot, message) {
    const roles = message.guild.roles.array();
    const colorRoles = roles.filter(
        (role) => role.name.startsWith(bot.config.colorPrefix));
    const lines = colorRoles.map((role) => {
        return `${role.name.split(bot.config.colorPrefix)[1]} - <@&${role.id}>`;
    });

    await bot.send(
        message.channel,
        `**__Colors available:__**\n${lines.join('\n')}`
    );
}
