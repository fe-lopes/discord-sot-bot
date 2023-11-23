const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, bold } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('kick')
		.setDescription('Expulsar usuário')
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
		.setDMPermission(false)
		.addUserOption(option =>
			option
				.setName('membro')
				.setDescription('Usuário a ser expulso do servidor')
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('motivo')
				.setDescription('Motivo da expulsão, se houver')),
	async execute(interaction) {
		const target = interaction.options.getUser('membro');
		const reason = interaction.options.getString('motivo') ?? 'nenhum motivo foi especificado';

		const confirm = new ButtonBuilder()
			.setCustomId('confirm')
			.setLabel('Confirmar')
			.setStyle(ButtonStyle.Danger);

		const cancel = new ButtonBuilder()
			.setCustomId('cancel')
			.setLabel('Cancelar')
			.setStyle(ButtonStyle.Secondary);

		const row = new ActionRowBuilder()
			.addComponents(cancel, confirm);

		const response = await interaction.reply({
			content: `Arr, tem certeza que deseja fazer ${target} andar na pracha pelo motivo: ${bold(reason)}?`,
			components: [row],
		});

		const collectorFilter = i => i.user.id === interaction.user.id;
		try {
			const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });
			if (confirmation.customId === 'confirm') {
				await interaction.guild.members.kick(target);
				await confirmation.update({ content: `Arr, ${bold(target.username)} foi jogado aos tubarões pelo motivo: ${bold(reason)}.`, components: [] });
			} else if (confirmation.customId === 'cancel') {
				await confirmation.update({ content: 'Arr, cancelamos a ação, marujo.', components: [] });
			}
		} catch (e) {
			await interaction.editReply({ content: 'Arr, o tempo para a ação acabou, marujo.', components: [] });
		}
	}
}
