const axios = require('axios');
const fs = require('fs');
const { SlashCommandBuilder, ChannelType, ActionRowBuilder, PermissionsBitField, RoleSelectMenuBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionFlagsBits, bold } = require('discord.js');
const config = require('../../bot-config.json');
const guildsData = require('../../guilds-data');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Configura as interações do bot')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommandGroup(subcommandGroup =>
            subcommandGroup.setName('welcome')
                .setDescription('Configura as mensagens de boas-vindas no canal especificado')
                .addSubcommand(subcommand =>
                    subcommand.setName('channel')
                        .setDescription('Configura o canal de boas-vindas')
                        .addChannelOption(channelOptions =>
                            channelOptions.setName('canal')
                                .setDescription('Selecione o canal desejado')
                                .setRequired(true)
                                .addChannelTypes(ChannelType.GuildText)))
                .addSubcommand(subcommand =>
                    subcommand.setName('primary-messages')
                        .setDescription('Configura as mensagens primárias de boas-vindas')
                        .addStringOption(option =>
                            option.setName('opção')
                                .setDescription('Selecione uma das opções de configuração')
                                .setRequired(true)
                                .addChoices(
                                    { name: 'adicionar', value: 'add' },
                                    { name: 'remover', value: 'remove' },
                                    { name: 'listar', value: 'list' })))
                .addSubcommand(subcommand =>
                    subcommand.setName('secondary-messages')
                        .setDescription('Configura as mensagens secundárias de boas-vindas')
                        .addStringOption(option =>
                            option.setName('opção')
                                .setDescription('Selecione uma das opções de configuração')
                                .setRequired(true)
                                .addChoices(
                                    { name: 'adicionar', value: 'add' },
                                    { name: 'remover', value: 'remove' },
                                    { name: 'listar', value: 'list' })))
                .addSubcommand(subcommand =>
                    subcommand.setName('emojis')
                        .setDescription('Configura os emojis de boas-vindas')
                        .addStringOption(option =>
                            option.setName('opção')
                                .setDescription('Selecione uma das opções de configuração')
                                .setRequired(true)
                                .addChoices(
                                    { name: 'adicionar', value: 'add' },
                                    { name: 'remover', value: 'remove' },
                                    { name: 'listar', value: 'list' }))))
        .addSubcommandGroup(subcommandGroup =>
            subcommandGroup.setName('auto-role')
                .setDescription('Configura a atribuição automática de cargos no canal especificado')
                .addSubcommand(subcommand =>
                    subcommand.setName('channel')
                        .setDescription('Configura o canal para atribuição dos cargos')
                        .addChannelOption(channelOptions =>
                            channelOptions.setName('canal')
                                .setDescription('Selecione o canal desejado')
                                .setRequired(true)
                                .addChannelTypes(ChannelType.GuildText)))
                .addSubcommand(subcommand =>
                    subcommand.setName('roles')
                        .setDescription('Configura os cargos para atribuição automática')
                        .addStringOption(option =>
                            option.setName('opção')
                                .setDescription('Selecione uma das opções de configuração')
                                .setRequired(true)
                                .addChoices(
                                    { name: 'adicionar', value: 'add' },
                                    { name: 'remover', value: 'remove' },
                                    { name: 'listar', value: 'list' }))))
        .addSubcommandGroup(subcommandGroup =>
            subcommandGroup.setName('guilds')
                .setDescription('Configura as guildas do Sea of Thieves do servidor')
                .addSubcommand(subcommand =>
                    subcommand.setName('manage')
                        .setDescription('Adiciona, remove ou lista as guildas do servidor')
                        .addStringOption(option =>
                            option.setName('opção')
                                .setDescription('Selecione uma das opções de configuração')
                                .setRequired(true)
                                .addChoices(
                                    { name: 'adicionar', value: 'add' },
                                    { name: 'remover', value: 'remove' },
                                    { name: 'listar', value: 'list' },
                                    { name: 'imagem', value: 'image' })))
                .addSubcommand(subcommand =>
                    subcommand.setName('cookie')
                        .setDescription('Atualizar cookie'))),
    async execute(interaction) {
        const guildData = await guildsData.find(data => data.guild_id === interaction.guild.id);

        let uniqueResponse = false;
        let response;
        if (interaction.options.getSubcommandGroup() === 'welcome') {
            if (interaction.options.getSubcommand() === 'channel') {
                const selectedChannel = interaction.options.getChannel('canal');
                selectedChannel.permissionOverwrites.set([
                    {
                        id: interaction.guild.roles.everyone,
                        deny: [PermissionsBitField.Flags.SendMessages],
                    },
                    {
                        id: this.client.user.id,
                        allow: [PermissionsBitField.Flags.SendMessages],
                    },
                ]);

                guildData.channels.welcome = selectedChannel.id;
                saveGuildsData();
                response = 'Canal de boas-vindas alterado com sucesso, capitão!';
                uniqueResponse = true;
            } else if (interaction.options.getSubcommand() === 'primary-messages') {
                const option = interaction.options.getString('opção');
                if (option === 'add') {
                    await interaction.reply({ content: 'Digite a nova mensagem primária de boas-vindas:', ephemeral: true });

                    const filter = m => m.author.id === interaction.user.id;
                    const collector = interaction.channel.createMessageCollector({ filter, time: 60_000, max: 1 });
                    collector.on('collect', async (message) => {
                        message.delete().catch(console.error);
                        const newMessage = message.content;
                        guildData.messages.welcome.welcome_1.push(newMessage);
                        saveGuildsData();
                        await interaction.editReply(`Aye-aye! Uma nova mensagem primária **"${newMessage}"** foi atirada ao baú das saudações com grande sucesso!`);
                        collector.stop();
                    });

                    collector.on('end', (collected, reason) => {
                        if (reason === 'time') {
                            interaction.editReply('**Avast!** O tempo escoou como a areia numa ampulheta sob o olhar do velho Poseidon, missão abortada!');
                        }
                    });
                } else if (option === 'remove') {
                    await interaction.reply({ content: 'Insira a mensagem que deseja remover:', ephemeral: true });

                    const filter = m => m.author.id === interaction.user.id;
                    const collector = interaction.channel.createMessageCollector({ filter, time: 60_000, max: 1 });
                    collector.on('collect', async (message) => {
                        message.delete().catch(console.error);

                        const messageIndex = guildData.messages.welcome.welcome_1.findIndex((welcomeMessage) => welcomeMessage === message.content);
                        if (messageIndex !== -1) {
                            guildData.messages.welcome.welcome_1.splice(messageIndex, 1);
                            saveGuildsData();
                            reply = 'Mensagem removida dos registros, como uma pegada na areia que o mar leva embora.';
                        } else {
                            reply = bold('Argh! Essa mensagem não foi avistada nos sete mares.\n');
                            reply += 'Garanta que inseriu a mensagem exatamente como a que quer apagar. Primeiro, liste as mensagens para que possa copiar a que deseja mandar para o baú de Davy Jones!';
                        }

                        await interaction.editReply(reply);
                        collector.stop();
                    });

                    collector.on('end', (collected, reason) => {
                        if (reason === 'time') {
                            interaction.editReply('**Avast!** O tempo escoou como a areia numa ampulheta sob o olhar do velho Poseidon, missão abortada!');
                        }
                    });
                } else if (option === 'list') {
                    response = bold('Aye-aye! Aqui estão as mensagens primárias de boas-vindas:\n')
                    response += await guildData.messages.welcome.welcome_1.length > 0
                        ? guildData.messages.welcome.welcome_1.join('\n')
                        : config.default_messages.welcome.welcome_1.join('\n')
                    uniqueResponse = true;
                }
            } else if (interaction.options.getSubcommand() === 'secondary-messages') {
                const option = interaction.options.getString('opção');
                if (option === 'add') {
                    await interaction.reply({ content: 'Digite a nova mensagem secundária de boas-vindas:', ephemeral: true });

                    const filter = m => m.author.id === interaction.user.id;
                    const collector = interaction.channel.createMessageCollector({ filter, time: 60_000, max: 1 });
                    collector.on('collect', async (message) => {
                        message.delete().catch(console.error);
                        const newMessage = message.content;
                        guildData.messages.welcome.welcome_2.push(newMessage);
                        saveGuildsData();
                        await interaction.editReply(`Arr, nova mensagem secundária **"${newMessage}"** adicionada com sucesso ao tesouro das boas-vindas!`);
                        collector.stop();
                    });

                    collector.on('end', (collected, reason) => {
                        if (reason === 'time') {
                            interaction.editReply('**Avast!** O tempo escoou como a areia numa ampulheta sob o olhar do velho Poseidon, missão abortada!');
                        }
                    });
                } else if (option === 'remove') {
                    await interaction.reply({ content: 'Insira a mensagem que deseja remover:', ephemeral: true });

                    const filter = m => m.author.id === interaction.user.id;
                    const collector = interaction.channel.createMessageCollector({ filter, time: 60_000, max: 1 });
                    collector.on('collect', async (message) => {
                        message.delete().catch(console.error);

                        const messageIndex = guildData.messages.welcome.welcome_2.findIndex((welcomeMessage) => welcomeMessage === message.content);
                        if (messageIndex !== -1) {
                            guildData.messages.welcome.welcome_2.splice(messageIndex, 1);
                            saveGuildsData();
                            reply = 'Mensagem removida dos registros, como uma pegada na areia que o mar leva embora.';
                        } else {
                            reply = bold('Argh! Essa mensagem não foi avistada nos sete mares.\n');
                            reply += 'Garanta que inseriu a mensagem exatamente como a que quer apagar. Primeiro, liste as mensagens para que possa copiar a que deseja mandar para o baú de Davy Jones!';
                        }

                        await interaction.editReply(reply);
                        collector.stop();
                    });

                    collector.on('end', (collected, reason) => {
                        if (reason === 'time') {
                            interaction.editReply('**Avast!** O tempo escoou como a areia numa ampulheta sob o olhar do velho Poseidon, missão abortada!');
                        }
                    });
                } else if (option === 'list') {
                    response = bold('Ahoy, aqui estão as mensagens secundárias de boas-vindas:\n');
                    response += guildData.messages.welcome.welcome_2.length > 0
                        ? guildData.messages.welcome.welcome_2.join('\n')
                        : config.default_messages.welcome.welcome_2.join('\n')
                    uniqueResponse = true;
                }
            } else if (interaction.options.getSubcommand() === 'emojis') {
                const option = interaction.options.getString('opção');
                if (option === 'add') {
                    await interaction.reply({ content: 'Digite o novo emoji:', ephemeral: true });

                    const filter = m => m.author.id === interaction.user.id;
                    const collector = interaction.channel.createMessageCollector({ filter, time: 60_000, max: 1 });
                    collector.on('collect', async (message) => {
                        message.delete().catch(console.error);
                        const newEmoji = message.content;

                        const emojiId = newEmoji.split(':')[2].slice(0, -1);
                        const emoji = message.guild.emojis.cache.get(emojiId);
                        if (!emoji) {
                            await interaction.editReply(`Argh, o emoji "${newEmoji}" não figura nos registros deste servidor, logo não pode ser salvo!`);
                            return;
                        }

                        guildData.messages.welcome.emojis.push(newEmoji);
                        saveGuildsData();
                        await interaction.editReply(`Ahoy, o mais recente emoji "${newEmoji}" foi incorporado com êxito ao cofre das saudações!`);
                        collector.stop();
                    });

                    collector.on('end', (collected, reason) => {
                        if (reason === 'time') {
                            interaction.editReply('**Avast!** O tempo escoou como a areia numa ampulheta sob o olhar do velho Poseidon, missão abortada!');
                        }
                    });
                } else if (option === 'remove') {
                    await interaction.reply({ content: 'Insira o emoji que deseja remover:', ephemeral: true });

                    const filter = m => m.author.id === interaction.user.id;
                    const collector = interaction.channel.createMessageCollector({ filter, time: 60_000, max: 1 });
                    collector.on('collect', async (message) => {
                        message.delete().catch(console.error);

                        const emojiIndex = guildData.messages.welcome.emojis.findIndex((emoji) => emoji === message.content);
                        if (emojiIndex !== -1) {
                            guildData.messages.welcome.emojis.splice(emojiIndex, 1);
                            saveGuildsData();
                            reply = 'Emoji removido dos registros, como uma pegada na areia que o mar leva embora.';
                        } else {
                            reply = bold('Argh! Esse emoji não foi avistado nos sete mares.\n');
                            reply += 'Garanta que inseriu o emoji exatamente como o que quer apagar. Primeiro, liste os emojis para que possa copiar o que deseja mandar para o baú de Davy Jones!';
                        }

                        await interaction.editReply(reply);
                        collector.stop();
                    });

                    collector.on('end', (collected, reason) => {
                        if (reason === 'time') {
                            interaction.editReply('**Avast!** O tempo escoou como a areia numa ampulheta sob o olhar do velho Poseidon, missão abortada!');
                        }
                    });
                } else if (option === 'list') {
                    response = bold('Ahoy, aqui estão os emojis de boas-vindas:\n');
                    response += guildData.messages.welcome.emojis.length > 0
                        ? guildData.messages.welcome.emojis.join('\n')
                        : config.default_messages.welcome.emojis.join('\n')
                    uniqueResponse = true;
                }
            }
        } else if (interaction.options.getSubcommandGroup() === 'auto-role') {
            if (interaction.options.getSubcommand() === 'channel') {
                const selectedChannel = interaction.options.getChannel('canal');

                selectedChannel.permissionOverwrites.set([
                    {
                        id: interaction.guild.roles.everyone,
                        deny: [PermissionsBitField.Flags.AddReactions, PermissionsBitField.Flags.UseApplicationCommands],
                    },
                ]);
                selectedChannel.setRateLimitPerUser(10);

                guildData.channels.autorole = selectedChannel.id;
                saveGuildsData();
                response = 'Canal de atribuição de cargos alterado com sucesso, capitão!';
                uniqueResponse(true);
            } else if (interaction.options.getSubcommand() === 'roles') {
                const option = interaction.options.getString('opção');
                if (option === 'add') {
                    row = new ActionRowBuilder()
                        .addComponents(
                            new RoleSelectMenuBuilder()
                                .setCustomId('role')
                        );

                    await interaction.reply({
                        content: 'Aye-aye, selecione o cargo a ser adicionado:',
                        components: [row],
                        ephemeral: true,
                    });

                    const filter = (i) => i.customId === 'role';
                    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60_000 });
                    collector.on('collect', async (menuInteraction) => {
                        const role = menuInteraction.values[0];
                        guildData.roles.push(role);
                        saveGuildsData();

                        roleName = interaction.guild.roles.cache.get(role).name.toLowerCase().replace(/ /g, '_');
                        await interaction.editReply({
                            content: `Cargo **${roleName}** adicionado com sucesso, capitão!`,
                            components: [],
                        });

                        collector.stop();
                    });

                    collector.on('end', (collected, reason) => {
                        if (reason === 'time') {
                            interaction.editReply('**Avast!** O tempo escoou como a areia numa ampulheta sob o olhar do velho Poseidon, missão abortada!');
                        }
                    });
                } else if (option === 'remove') {
                    row = new ActionRowBuilder()
                        .addComponents(
                            new RoleSelectMenuBuilder()
                                .setCustomId('role')
                        );

                    await interaction.reply({
                        content: 'Aye-aye, selecione o cargo a ser removido:',
                        components: [row],
                        ephemeral: true,
                    });

                    const filter = (i) => i.customId === 'role';
                    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60_000 });
                    collector.on('collect', async (menuInteraction) => {
                        const role = menuInteraction.values[0];
                        const roleIndex = guildData.roles.findIndex((r) => r === role);
                        if (roleIndex !== -1) {
                            guildData.roles.splice(roleIndex, 1);
                            saveGuildsData();

                            roleName = interaction.guild.roles.cache.get(role).name.toLowerCase().replace(/ /g, '_');
                            await interaction.editReply({
                                content: `Cargo **${roleName}** removido com sucesso dos registros da embarcação. Arr, é como se essa função nunce tivesse existido aqui!`,
                                components: [],
                            });
                        }

                        collector.stop();
                    });

                    collector.on('end', (collected, reason) => {
                        if (reason === 'time') {
                            interaction.editReply({content: '**Avast!** O tempo escoou como a areia numa ampulheta sob o olhar do velho Poseidon, missão abortada!', components: [], });
                        }
                    });
                } else if (option === 'list') {
                    response = 'Ahoy, parece que não há nenhum cargo nos registros ainda. Que tal criar um agora mesmo?';
                    if (guildData.roles.length > 0) {
                        response = bold('Aye-aye! Aqui estão todos os cargos para atribuição automática:\n');
                        guildData.roles.forEach(roleId => {
                            role = interaction.guild.roles.cache.get(roleId);
                            if (role) response += role.name.toLowerCase().replace(/ /g, '_') + '\n';
                        });
                    }

                    uniqueResponse = true;
                }
            }
        } else if (interaction.options.getSubcommandGroup() === 'guilds') {
            const option = interaction.options.getString('opção');
            if (interaction.options.getSubcommand() === 'manage') {
                if (option === 'add') {
                    await interaction.reply({ content: 'Digite o ID da guild a ser adicionada:', ephemeral: true });

                    const filter = m => m.author.id === interaction.user.id;
                    const collector = interaction.channel.createMessageCollector({ filter, time: 60_000, max: 1 });
                    collector.on('collect', async (message) => {
                        message.delete().catch(console.error);

                        if (guildData.sot_cookie) {
                            await interaction.editReply('Processando...');
                            const guildId = message.content;
                            try {
                                let requestUrl = new URL(config.sot.urls.guild_summary);
                                let referer = new URL(config.sot.headers.referer);
                                referer.pathname += `/${guildId}`;
                                const responseContent = await axios.get(requestUrl.toString(), {
                                    headers: {
                                        'accept-language': config.sot.headers.accept_language,
                                        'referer': referer.toString(),
                                        'user-agent': config.sot.headers.user_agent,
                                        'cookie': guildData.sot_cookie,
                                    },
                                });

                                const sotGuild = responseContent.data[0];
                                const {
                                    Branding: { GuildName }
                                } = sotGuild;

                                const newGuild = { id: guildId, name: GuildName, image: '', };
                                guildData.sot_guilds.push(newGuild);
                                saveGuildsData();
                                reply = `Aye-aye! A guilda **${GuildName}** foi adicionada ao registro de guildas do servidor!`;
                            } catch (err) {
                                console.error('Error fetching SoT guild data:', err);
                                reply = bold('Ahoy, parece que houve um erro ao buscar informações da guilda.\n');
                                reply += 'Verifique se o cookie utilizado é válido ou tente novamente mais tarde.';
                            }
                        } else {
                            reply = 'É necessário ter um cookie válido salvo primeiro, arr!';
                        }
                        await interaction.editReply(reply);
                        collector.stop();
                    });

                    collector.on('end', (collected, reason) => {
                        if (reason === 'time') {
                            interaction.editReply('**Avast!** O tempo escoou como a areia numa ampulheta sob o olhar do velho Poseidon, missão abortada!');
                        }
                    });
                } else if (option === 'list') {
                    if (await guildData.sot_guilds.length > 0) {
                        response = bold('Aye-aye! Aqui estão as guildas registradas do nosso servidor:\n')
                        response += guildData.sot_guilds.map(guild => guild.name).join('\n');
                        response += '\n\nSe o nome de alguma guilda estiver desatualizado, basta remover e adicioná-la novamente!';
                    } else {
                        response = 'Parece que ainda não há nenhuma guilda registrada neste servidor, capitão.';
                    }
                    uniqueResponse = true;
                } else if (option === 'remove') {
                    await interaction.reply({ content: 'Insira o ID da guilda que deseja remover:', ephemeral: true });

                    const filter = m => m.author.id === interaction.user.id;
                    const collector = interaction.channel.createMessageCollector({ filter, time: 60_000, max: 1 });
                    collector.on('collect', async (message) => {
                        message.delete().catch(console.error);

                        const guildIndex = guildData.sot_guilds.findIndex((id) => id === message.content);
                        if (guildIndex !== -1) {
                            guildData.messages.sot_guilds.splice(guildIndex, 1);
                            saveGuildsData();
                            reply = 'Guilda removida dos registros, como uma pegada na areia que o mar leva embora.';
                        } else {
                            reply = bold('Argh! Essa guilda não foi avistada nos sete mares.\n');
                            reply += 'Garanta que inseriu exatamente o ID da guilda que quer remover. Primeiro, liste as guildas para que possa copiar o ID da que deseja mandar para o baú de Davy Jones!';
                        }

                        await interaction.editReply(reply);
                        collector.stop();
                    });

                    collector.on('end', (collected, reason) => {
                        if (reason === 'time') {
                            interaction.editReply('**Avast!** O tempo escoou como a areia numa ampulheta sob o olhar do velho Poseidon, missão abortada!');
                        }
                    });
                } else if (option === 'image') {
                    if (guildData.sot_guilds && guildData.sot_guilds.length > 0) {
                        let guildsOptions = [];
                        guildData.sot_guilds.forEach((guild, index) => {
                            selectOption = new StringSelectMenuOptionBuilder().setLabel(guild.name).setValue(index.toString());
                            guildsOptions.push(selectOption);
                        });
                        const select = new StringSelectMenuBuilder().setCustomId('guildSelectMenu').setPlaceholder('Guilda').addOptions(guildsOptions);
                        const row = new ActionRowBuilder().addComponents(select);
                        await interaction.reply({ content: 'Selecione uma guilda:', components: [row], ephemeral: true, });

                        const filter = i => i.customId === 'guildSelectMenu' && i.user.id === interaction.user.id;
                        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60_000, max: 1 });
                        collector.on('collect', async i => {
                            const selectedGuildIndex = parseInt(i.values[0]);
                            await interaction.editReply({ content: 'Insira a URL da imagem para a guilda:', components: [], });

                            const filter = m => m.author.id === interaction.user.id;
                            const collector = interaction.channel.createMessageCollector({ filter, time: 60_000, max: 1 });
                            collector.on('collect', async message => {
                                message.delete().catch(console.error);
                                if (isValidUrl(message.content) && config.supported_images.includes(message.content.split('.').pop())) {
                                    guildData.sot_guilds[selectedGuildIndex].image = message.content;
                                    saveGuildsData();
                                    reply = 'Aye-aye! Imagem da guilda atualizada com sucesso.';
                                } else {
                                    reply = '**Argh!** Essa URL me parece inválida.\n';
                                    reply += 'Os formatos de imagem aceitos são: ' + config.supported_images.join(', ').toUpperCase() + '.';
                                }
                                await interaction.editReply(reply);
                                collector.stop();
                            });
                            collector.on('end', (collected, reason) => {
                                if (reason === 'time') {
                                    interaction.editReply({ content: '**Avast!** O tempo escoou como a areia numa ampulheta sob o olhar do velho Poseidon, missão abortada!', components: [] });
                                }
                            });
                        });
                        collector.on('end', (collected, reason) => {
                            if (reason === 'time') {
                                interaction.editReply({ content: '**Avast!** O tempo escoou como a areia numa ampulheta sob o olhar do velho Poseidon, missão abortada!', components: [] });
                            }
                        });
                    } else {
                        await interaction.reply({ content: 'Ainda não há nenhuma guilda em nossos registros, capitão.', ephemeral: true });
                    }
                }
            } else if (interaction.options.getSubcommand() === 'cookie') {
                await interaction.reply({ content: 'Insira o novo cookie:', ephemeral: true });

                const filter = m => m.author.id === interaction.user.id;
                const collector = interaction.channel.createMessageCollector({ filter, time: 60_000, max: 1 });
                collector.on('collect', async (message) => {
                    message.delete().catch(console.error);
                    guildData.sot_cookie = message.content;
                    saveGuildsData();
                    reply = 'Aye-aye, cookie atualizado!';

                    await interaction.editReply(reply);
                    collector.stop();
                });

                collector.on('end', (collected, reason) => {
                    if (reason === 'time') {
                        interaction.editReply('**Avast!** O tempo escoou como a areia numa ampulheta sob o olhar do velho Poseidon, missão abortada!');
                    }
                });
            }
        }

        if (uniqueResponse)
            await interaction.reply({ content: response, ephemeral: true });
    },
};

function saveGuildsData() {
    fs.writeFile('guilds-data.json', JSON.stringify(guildsData, null, 2), (err) => {
        if (err) {
            console.error('Error saving guilds-data.json:', err);
        }
    });
}

function isValidUrl(str) {
    try {
        new URL(str);
        return true
    } catch (err) {
        return false
    }
}
