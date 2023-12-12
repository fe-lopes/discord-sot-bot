const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('node:path');
const dawnColor = 0xFCD800;
const dayColor = 0x38B4E7;
const duskColor = 0xFE6B0C;
const nightColor = 0x051C48;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('time')
        .setDescription('Mostra data e hora atuais dentro do Sea of Thieves'),
    async execute(interaction) {
        const gameTime = getGameTime();

        let imageUrl;
        let embedColor;
        if (gameTime.hour === 6) {
            imageName = 'https://i.imgur.com/Bwb8jwT.png';
            embedColor = dawnColor;
        } else if (gameTime.hour > 6 && gameTime.hour < 20) {
            imageUrl = 'https://i.imgur.com/T82fXYl.png';
            embedColor = dayColor;
        } else if (gameTime.hour === 20) {
            imageUrl = 'https://i.imgur.com/r9oqCN7.png';
            embedColor = duskColor;
        } else {
            imageUrl = 'https://i.imgur.com/pyvW3eY.png';
            embedColor = nightColor;
        }

        const dateTimeEmbed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(`Dia **${gameTime.day}** às **${gameTime.hour}:${gameTime.minute}**`)
            .setFooter({ text: 'Estoque dos postos marítimos mudam diariamente às 00:00' })
            .setThumbnail(imageUrl)
            .addFields(
                { name: 'Nascer do sol', value: '5:00', inline: true },
                { name: 'Pôr do sol', value: '22:00', inline: true },
            )

        await interaction.reply({ embeds: [dateTimeEmbed] });
    },
};

function getGameTime() {
    const currentDate = new Date();
    const currentUTC = new Date(currentDate.toISOString());

    const realWorldSeconds = currentUTC.getUTCSeconds() + currentUTC.getUTCMinutes() * 60 + currentUTC.getUTCHours() * 3600;
    const gameDaysAdjusted = Math.floor(realWorldSeconds / 24 / 60) % 30;
    const remainingSeconds = realWorldSeconds % (24 * 60);
    const gameHours = Math.floor(remainingSeconds / 60);
    const gameMinutes = Math.floor(remainingSeconds % 60);

    return {
        day: gameDaysAdjusted + 1,
        hour: gameHours,
        minute: gameMinutes.toString().padStart(2, '0'),
    };
}
