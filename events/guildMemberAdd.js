const { Events, bold } = require('discord.js');
const config = require('../bot-config.json');
const guildsData = require('../guilds-data');

module.exports = {
    name: Events.GuildMemberAdd, async execute(member) {
        const guildId = member.guild.id;
        const guildName = member.guild.name;
        const guildData = await guildsData.find((data) => data.guild_id === guildId);

        if (!guildData || !guildData.channels || !guildData.channels.welcome) {
            console.log(`Channel data not found for server "${guildName}" ($guildId}). Skipping welcome message.`);
            return;
        }

        const channelId = guildData.channels.welcome;
        const channel = member.guild.channels.cache.find(ch => ch.id === channelId);

        if (!channel) {
            console.log(`Welcome channel not found for server "${guildName}" (${guildId}). Skipping welcome message.`);
            return;
        }

        const welcomeData = guildData.messages && guildData.messages.welcome
            ? guildData.messages.welcome
            : config.default_messages.welcome;

        let emojis = welcomeData.emojis;
        let validEmojis = [];
        if (emojis.length > 0) {
            emojis.forEach(emojiStr => {
                const emojiId = emojiStr.split(':')[2].slice(0, -1);
                const emoji = member.guild.emojis.cache.get(emojiId);
                if (emoji) {
                    validEmojis.push(emoji);
                }
            });
        }
        const emoji = validEmojis.length > 0
            ? validEmojis[Math.floor(Math.random() * validEmojis.length)]
            : config.default_messages.welcome.emojis[Math.floor(Math.random() * config.default_messages.welcome.emojis.length)];

        const message1 = welcomeData.welcome_1.length > 0
            ? welcomeData.welcome_1[Math.floor(Math.random() * welcomeData.welcome_1.length)]
            : config.default_messages.welcome.welcome_1[0];

        const message2 = welcomeData.welcome_2.length > 0
            ? welcomeData.welcome_2[Math.floor(Math.random() * welcomeData.welcome_2.length)]
            : config.default_messages.welcome.welcome_2[0];

        const welcomeMessage = `${bold(message1)} ${emoji}\n<@${member.user.id}> ${message2}.`;
        try {
            await channel.send(welcomeMessage);
        } catch (err) {
            console.error('Bot doesn\'t have permission to send messages in this channel:', err);
        }
    }
}
