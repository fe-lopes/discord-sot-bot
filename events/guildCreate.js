const fs = require('fs');
const { Events, PermissionsBitField } = require('discord.js');
const config = require('../bot-config.json');
const guildsData = require('../guilds-data');

module.exports = {
    name: Events.GuildCreate, async execute(guild) {
        const guildIndex = await guildsData.findIndex((data) => data.guild_id === guild.id);
        if (guildIndex !== -1) { guildsData.splice(guildIndex, 1) };

        const defaultChannels = {
            welcome: config.default_channels.welcome,
            autorole: config.default_channels.autorole,
        };

        const guildData = {
            guild_id: guild.id,
            channels: {
                welcome: '',
                autorole: '',
            },
            messages: {
                welcome: {
                    emojis: [],
                    welcome_1: [],
                    welcome_2: [],
                },
            },
            roles: [],
            sot_cookie: '',
            sot_guilds: [],
        };

        const createCommonChannel = async (selectedChannel, channelName, slowModeDuration, permissionOverwrites) => {
            const existingChannel = guild.channels.cache.find((channel) => channel.name === channelName);
            let channelId = '';

            if (!existingChannel) {
                const newChannel = await guild.channels.create({
                    name: channelName,
                    type: 0,
                    rateLimitPerUser: slowModeDuration,
                    permissionOverwrites,
                });
                channelId = newChannel.id;
            } else {
                channelId = existingChannel.id;
            }

            guildData.channels[selectedChannel] = channelId;
        };

        try {
            await createCommonChannel('welcome', defaultChannels.welcome, 0, [
                { id: guild.roles.everyone, deny: [PermissionsBitField.Flags.SendMessages] },
                { id: (await guild.members.fetch(guild.client.user.id)).user.id, allow: [PermissionsBitField.Flags.SendMessages] },
            ]);

            await createCommonChannel('autorole', defaultChannels.autorole, 10, [
                { id: guild.roles.everyone, deny: [PermissionsBitField.Flags.AddReactions, PermissionsBitField.Flags.UseApplicationCommands] },
            ]);
        } catch (err) {
            console.error('Bot doesn\'t have permission to create channels:', err);
        }

        guildsData.push(guildData);
        saveGuildsData();

        console.log(`[ADDITION] The server "${guild.name}" (${guild.id}) has added the bot.`);
    }
}

function saveGuildsData() {
    fs.writeFile('guilds-data.json', JSON.stringify(guildsData, null, 2), (err) => {
        if (err) {
            console.error('Error saving guilds-data.json:', err);
        }
    });
}
