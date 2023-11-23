const { Events } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate, async execute(interaction) {
		const command = interaction.client.commands.get(interaction.commandName);
		if (!command) return;

		if (interaction.commandName === 'modal') {
			return;
		} else if (interaction.isChatInputCommand()) {
			try {
				await command.execute(interaction);
			} catch (error) {
				console.error(`Error executing command ${interaction.commandName}:`, error);
			}
		} else if (interaction.isAutocomplete()) {
			try {
				await command.autocomplete(interaction);
			} catch (error) {
				console.error(`Error executing autocomplete command ${interaction.commandName}:`, error);
			}
		} else if (interaction.isButton()) {
			try {
				await command.execute(interaction);
			} catch (error) {
				console.error(`Error executing command with buttons ${interaction.commandName}:`, error);
			}
		} else if (interaction.isStringSelectMenu()) {
			try {
				await command.execute(interaction);
			} catch (error) {
				console.error(`Error executing command with select menu ${interaction.commandName}:`, error);
			}
		} else if (interaction.isModalSubmit()) {
			console.log(interaction);
		}
	}
};
