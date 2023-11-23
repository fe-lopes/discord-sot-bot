const fs = require('fs');
const { Events } = require('discord.js');
const guildsData = require('../guilds-data');

module.exports = {
    name: Events.GuildDelete, async execute(guild) {
        const guildIndex = await guildsData.findIndex((data) => data.guild_id === guild.id);

        if (guildIndex !== -1) {
            guildsData.splice(guildIndex, 1);
            saveGuildsData();
            console.log(`[REMOTION] The server "${guild.name}" (${guild.id}) has removed the bot.`);
        }
    }
}

function saveGuildsData() {
    fs.writeFile('guilds-data.json', JSON.stringify(guildsData, null, 2), (err) => {
        if (err) {
            console.error('Erro ao salvar guilds-data.json:', err);
        }
    });
}
