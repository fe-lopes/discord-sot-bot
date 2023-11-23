const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage, GlobalFonts  } = require('@napi-rs/canvas');

const d20Background = loadImage('./assets/d20_background.png');
GlobalFonts.registerFromPath('./assets/fonts/windlass.ttf', 'Windlass');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('d20')
		.setDescription('Rola um D20'),
	async execute(interaction) {
        const result = Math.floor(Math.random() * 20) + 1;
        const canvas = createCanvas(200, 200);
        const context = canvas.getContext('2d');

        context.drawImage(await d20Background, 0, 0, 200, 200);
        context.save();
        context.translate(100, 100);
        context.rotate(-35 * (Math.PI / 180));

        context.font = '21px Windlass';
        context.textAlign = 'center';
        context.fillStyle = 'black';

        context.fillText(result.toString(), 10, 25);
        context.restore();

        const buffer = canvas.toBuffer('image/png');
        const attachment = new AttachmentBuilder(buffer, 'resultado_d20.png');
		await interaction.reply({
            content: `Seu resultado é ${result}!`,
            files: [attachment],
        });
	},
};
