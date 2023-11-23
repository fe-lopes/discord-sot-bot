const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('server')
		.setDescription('Exibe informações do servidor'),
	async execute(interaction) {
		const serverCreationDate = Math.floor(interaction.guild.createdAt.getTime() / 1000);
		await interaction.reply(`A embarcação **${interaction.guild.name}** foi lançada ao mar em **<t:${serverCreationDate}:F>** e possui **${interaction.guild.memberCount} piratas** a bordo.`);
	},
};
