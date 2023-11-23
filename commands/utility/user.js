const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('user')
		.setDescription('Exibe informações sobre você, marujo'),
	async execute(interaction) {
		const roles = interaction.member.roles.cache.filter(role => role.name !== '@everyone').map(role => role.name).join(', ');
		let activities = interaction.member.presence ? interaction.member.presence.activities : [];
		activities = activities.length > 0 ? activities.join(', ') : 'nada no momento';
		const joinedAtDate = Math.floor(interaction.member.joinedAt.getTime() / 1_000);
		const accountCreationDate = Math.floor(interaction.user.createdAt.getTime() / 1_000);
		const avatarURL = interaction.user.displayAvatarURL();

		await interaction.reply(`Arr, este comando foi executado pelo pirata ${interaction.user}, que embarcou neste navio em **<t:${joinedAtDate}:F>**. Este lobo do mar possui os seguintes cargos: **${roles}**. Atualmente, está ocupado com: **${activities}**. Criou sua conta Discord em **<t:${accountCreationDate}:F>** e você pode ver seu avatar clicando aqui: ${avatarURL}.`);
	},
};
