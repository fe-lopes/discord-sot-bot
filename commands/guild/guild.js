const axios = require('axios');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const guildsData = require('../../guilds-data');

let guildData;
module.exports = {
    data: new SlashCommandBuilder()
        .setName('guild')
        .setDescription('Exibe informações sobre as guildas do servidor')
        .addStringOption(option =>
            option.setName('nome')
                .setDescription('Nome da guilda')
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('opção')
                .setDescription('Escolha uma das opções')
                .setRequired(true)
                .addChoices(
                    { name: 'geral', value: 'overview' },
                    { name: 'membros', value: 'members' },
                    { name: 'barcos', value: 'ships' },
                )),
    async autocomplete(interaction) {
        guildData = await guildsData.find(data => data.guild_id === interaction.guild.id);
        const options = guildData.sot_guilds ? guildData.sot_guilds.map(guild => guild.name) : [];

        if (!interaction.replied) {
            await interaction.respond(
                options.map(choice => ({ name: choice, value: choice })),
            );
        }
    },
    async execute(interaction) {
        const selectedOption = interaction.options.get('opção').value;
        const selectedGuild = guildData.sot_guilds.find(guild => guild.name === interaction.options.get('nome').value);
        if (selectedGuild) {
            await interaction.reply('Processando...');
            let serverLocale = interaction.guild.preferredLocale;
            serverLocale = serverLocale.replace('-', '_');

            let sotConfig;
            try {
                sotConfig = await yaml.load(fs.readFileSync(path.join(__dirname, '../../sot-config.yaml'), 'utf8'));
            } catch (err) {
                console.error(err);
            }

            let requestUrl;
            let referer = new URL(sotConfig.headers.referer);
            referer.pathname += `/${selectedGuild.id}`;
            const requestHeaders = {
                'accept-language': sotConfig.headers.accept_language,
                'referer': referer.toString(),
                'user-agent': sotConfig.headers.user_agent,
                'cookie': guildData.sot_cookie,
            }

            if (selectedOption === 'overview') {
                requestUrl = sotConfig.request_urls.guild_summary;

                if (serverLocale.startsWith('pt')) {
                    requestUrl = requestUrl.replace('{lang}', 'pt-br');
                } else if (serverLocale.startsWith('es')) {
                    requestUrl = requestUrl.replace('{lang}', 'es');
                } else if (serverLocale === '') {
                    requestUrl = requestUrl.replace('/{lang}', '');
                }

                try {
                    const response = await axios.get(requestUrl.toString(), {
                        headers: { ...requestHeaders }
                    });

                    const sotGuild = response.data[0];
                    const {
                        Branding: { GuildName, Motto,
                            Icon: { IconId },
                            ColourSwatch: { SwatchId }
                        },
                        Reputation: { Level, DistinctionLevel, NextCompanyLevel, Xp },
                        NumberOfMembers,
                        NumberOfShips,
                        ShipsOutAtSea,
                    } = sotGuild;

                    const iconImageIndex = IconId.split('-')[1];
                    const colorId = SwatchId.split('-')[1];
                    const color = sotConfig.guild_colors[colorId - 1];
                    const colorValue = getColorValue(color);

                    const xpRequiredToAttain = NextCompanyLevel.XpRequiredToAttain;
                    const xpPercentage = ((Xp / xpRequiredToAttain) * 100).toFixed(2);

                    const localization = {
                        default: {
                            shipsAtSea: ' ship(s) sailing by the guild at the moment.',
                            level: 'Level',
                            distinction: 'Distinction',
                            members: 'Members',
                            ships: 'Ships'
                        },
                        pt_BR: {
                            shipsAtSea: ' barco(s) navegando pela guilda no momento.',
                            level: 'Nível',
                            distinction: 'Distinção',
                            members: 'Membros',
                            ships: 'Barcos'
                        },
                        es_ES: {
                            shipsAtSea: ' barco(s) navegando por la gremio en este momento.',
                            level: 'Nivel',
                            distinction: 'Distinción',
                            members: 'Miembros',
                            ships: 'Barcos'
                        }
                    };
                    let locale = localization[serverLocale] ? serverLocale : 'default';

                    const shipsAtSea = ShipsOutAtSea.toString() + localization[locale].shipsAtSea;
                    const guildEmbed = new EmbedBuilder()
                        .setColor(colorValue)
                        .setTitle(GuildName)
                        .setDescription(Motto)
                        .setThumbnail(sotConfig.img_urls.guild_icons[iconImageIndex - 1])
                        .setImage(selectedGuild.image)
                        .addFields(
                            { name: '\u200B', value: '\u200B' },
                            { name: localization[locale].level, value: `${(Level % 100).toString()} (${xpPercentage}%)`, inline: false },
                            { name: localization[locale].distinction, value: DistinctionLevel.toString(), inline: true },
                            { name: localization[locale].members, value: `${NumberOfMembers.toString()}/${sotConfig.guild_caps.members}`, inline: true },
                            { name: localization[locale].ships, value: `${NumberOfShips.toString()}`, inline: true },
                        )
                        .setFooter({ text: shipsAtSea });

                    await interaction.editReply({ content: '', embeds: [guildEmbed] });
                } catch (err) {
                    console.error(err);
                    await interaction.editReply('Arrr! Um erro surgiu ao buscar as informações da guilda, tente novamente mais tarde.');w3eeeeeeeeeeeeeeeeeeeeeeeee
                }
            } else if (selectedOption === 'ships') {
                requestUrl = new URL(sotConfig.request_urls.guild_ships);
                requestUrl.searchParams.append('guild', selectedGuild.id);
                try {
                    const response = await axios.get(requestUrl.toString(), {
                        headers: { ...requestHeaders }
                    });

                    const sotShips = response.data;
                    const { Ships,
                        Paths: { Entitlement }
                    } = sotShips;

                    let shipsAtSea = Ships.filter(ship => !ship.SailingState.startsWith('Not'));
                    let shipsEmbeds = [];
                    if (shipsAtSea.length > 0) {
                        for (let i = 0; i < Math.min(shipsAtSea.length, 10); i++) {
                            const { Name, Type, SailImage, Alignment, Crew } = shipsAtSea[i];
                            const shipSailImage = Entitlement + '/' + SailImage;

                            let alignmentText = Alignment.replace(/\s+/g, '_').toLowerCase();
                            const alignmentColor = sotConfig.alignment_colors[alignmentText];
                            const colorValue = getColorValue(alignmentColor);

                            if (sotConfig.localization.alignments[alignmentText] && sotConfig.localization.alignments[alignmentText][serverLocale])
                                alignmentText = sotConfig.localization.alignments[alignmentText][serverLocale];
                            
                            alignmentText = capitalizeFirstLetterOfEachWord(alignmentText.replace(/_/g, ' '));

                            let shipType = Type.toLowerCase();
                            let shipSize;
                            switch(shipType) {
                                case 'sloop':
                                    shipSize = 2;
                                    break;
                                case 'brigantine':
                                    shipSize = 3;
                                    break;
                                default:
                                    shipSize = 4;
                            }

                            if (sotConfig.localization.ships[shipType] && sotConfig.localization.ships[shipType][serverLocale])
                                shipType = sotConfig.localization.ships[shipType][serverLocale];

                            const embed = new EmbedBuilder()
                                .setColor(colorValue)
                                .setTitle(Name)
                                .setDescription(capitalizeFirstLetterOfEachWord(shipType))
                                .setImage(shipSailImage)
                                .setFooter({ text: alignmentText })

                            let fields = [];
                            for (let j = 0; j < shipSize; j++) {
                                player = (shipsAtSea[i].Crew && shipsAtSea[i].Crew[j] && shipsAtSea[i].Crew[j].Gamertag) ? shipsAtSea[i].Crew[j].Gamertag : 'N/A';
                                const field = { name: `Membro ${j+1}`, value: player, inline: true };
                                fields.push(field);
                            }

                            embed.addFields(fields);
                            shipsEmbeds.push(embed);
                        }

                        await interaction.editReply({ content: '', embeds: shipsEmbeds });
                    } else {
                        await interaction.editReply('Não há nenhum barco navegando pela guilda.');
                    }
                } catch (err) {
                    console.error(err);                    
                    await interaction.editReply('Um erro surgiu ao espiar os navios disponíveis, tente novamente mais tarde.');
                }
            } else if (selectedOption === 'members') {
                requestUrl = new URL(sotConfig.request_urls.guild_members);
                requestUrl.searchParams.append('guild', selectedGuild.id);
                try {
                    const response = await axios.get(requestUrl.toString(), {
                        headers: { ...requestHeaders }
                    });
                    
                    const localization = {
                        default: {
                            totalMembers: 'members',
                        },
                        pt_BR: {
                            totalMembers: 'membros',
                        },
                        es_ES: {
                            totalMembers: 'miembros',
                        }
                    }

                    const members = response.data;
                    const membersEmbed = new EmbedBuilder()
                        .setTitle(selectedGuild.name)
                        .setDescription(`${members.length}/${sotConfig.guild_caps.members} ${localization[serverLocale].totalMembers}`)
                        .addFields({ name: '\u200B', value: '\u200B' });
                    members.forEach(member => {
                        const { Role, Gamertag } = member;
                        let memberRole = Role.toLowerCase();
                        if (sotConfig.localization.guild_roles[memberRole] && sotConfig.localization.guild_roles[memberRole][serverLocale])
                            memberRole = sotConfig.localization.guild_roles[memberRole][serverLocale];

                        membersEmbed.addFields({ name: capitalizeFirstLetterOfEachWord(memberRole), value: Gamertag, inline: true });
                    });
                    await interaction.editReply({ content: '', embeds: [membersEmbed] });
                } catch (err) {
                    console.error(err);
                    await interaction.editReply('Houve um erro ao olhar o registro de tripulantes da guilda, verifique novamente mais tarde.');
                }
            }
        } else {
            await interaction.reply('Nenhuma guilda registrada com esse nome foi encontrada, marujo.');
        }
    },
};

function getColorValue(color) {
    const hexString = color.toString(16);
    const paddedHexString = hexString.padStart(6, '0');
    return parseInt(paddedHexString, 16);
}

function capitalizeFirstLetterOfEachWord(str) {
    return str.split(' ')
        .map(function(word) {
            return word.split('-')
                .map(function(subword) {
                    return subword.charAt(0).toUpperCase() + subword.substring(1);
                })
                .join('-');
        })
        .join(' ');
}
