const fs = require('node:fs');
const path = require('node:path');
const config = require('../../bot-config.json');
const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('island')
        .setDescription('Procura as informações de uma ilha')
        .addStringOption(option =>
            option.setName('nome')
                .setDescription('Nome da ilha')
                .setRequired(true)
                .setAutocomplete(true)),
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused(true).value.toLowerCase();
        const choices = config.islands.map(island => island.name);
        const filtered = choices.filter(choice => choice.toLowerCase().includes(focusedValue));

        let options;
        filtered.sort();
        if (filtered.length > 25) {
            options = filtered.slice(0, 25);
        } else {
            options = filtered;
        }

        if (!interaction.replied) {
            await interaction.respond(
                options.map(choice => ({ name: choice, value: choice })),
            );
        }
    },
    async execute(interaction) {
        if (!interaction.replied) {
            const selectedOption = interaction.options.get('nome');
            const island = config.islands.find(island => island.name === selectedOption.value);
            let response;
            if (island) {
                const guild = interaction.guild;
                const emojis = guild.emojis.cache;
                const region = config.regions.find((r) => r.id === island.region);
                let emoji = emojis.find((emoji) => emoji.name === region.emoji);
                emoji = (emoji) ? emoji : '';
                response = `${emoji} ${region.name}: **${island.name}** (${island.grid})`;
                if (island.animals.pig) response += ' 🐷';
                if (island.animals.chicken) response += ' 🐔';
                if (island.animals.snake) response += ' 🐍';

                const imageName = island.name.toLowerCase().replace(/ /g, '-');
                const imagePath = path.join(__dirname, `../../assets/islands/${imageName}.png`);
                if (fs.existsSync(imagePath)) {
                    const backgroundPath = path.join(__dirname, '../../assets/island_background.png');
                    const islandBackground = await loadImage(backgroundPath);
                    const islandImage = await loadImage(imagePath);

                    const canvas = createCanvas(islandBackground.width, islandBackground.height);
                    const context = canvas.getContext('2d');
                    context.drawImage(islandBackground, 0, 0);

                    const islandX = (islandBackground.width - islandImage.width) / 2;
                    const islandY = (islandBackground.height - islandImage.height) / 2;

                    context.drawImage(islandImage, islandX, islandY);
                    const buffer = canvas.toBuffer('image/png');
                    const attachment = new AttachmentBuilder(buffer, `${imageName}.png`);
                    response = { content: response, files: [attachment] };
                }
            } else {
                response = 'Arr, não consegui encontrar essa ilha, marujo. Verifique o nome e busque novamente\n**Talvez esteja escondida no nevoeiro ou em algum mapa de tesouro perdido!**';
            }
            await interaction.reply(response);
        }
    },
};
