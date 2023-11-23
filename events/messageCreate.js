const { Events } = require('discord.js');
const guildsData = require('../guilds-data');

module.exports = {
    name: Events.MessageCreate, async execute(message) {
        if (message.author.bot) return;
        const guildData = guildsData.find((data) => data.guild_id === message.guildId);

        if (guildData && guildData.channels && guildData.channels.autorole) {
            if (message.channelId === guildData.channels.autorole) {
                message.delete().catch(console.error);
                let response;
                if (message.content.startsWith('!')) {
                    const command = message.content.slice(1);
                    let roleObject = message.guild.roles.cache.find(r => r.name.toLowerCase().replace(/ /g, '_') === command);
                    if (roleObject) {
                        if (guildData.roles.includes(roleObject.id)) {
                        const hasRole = message.member.roles.cache.has(roleObject.id);
                        try {
                            if (hasRole) {
                                await message.member.roles.remove(roleObject);
                                response = `Arr, <@${message.author.id}> você não é mais **${command}**, por ordem do capitão!`;
                            }
                            else {
                                await message.member.roles.add(roleObject)
                                response = `Aye aye, <@${message.author.id}>! Agora você é um orgulhoso **${command}**, por ordem do capitão!`;
                            }
                        } catch (err) {
                            response = `Arr, eu não posso adicionar ou remover cargos, marujo.\n**Preciso de uma posição mais alta na hierarquia do navio do que os cargos a serem atribuídos!**`
                        }
                    } else {
                        response = `<@${message.author.id}> não é permitido requisitar esse cargo, arr.\n**Insira um cargo dentre os permitidos, marujo!**`;
                    }
                    } else {
                        response = `<@${message.author.id}> esse cargo não existe neste navio, arr.\n**Insira um cargo válido, marujo!**`;
                    }
                } else {
                    response = `Ei <@${message.author.id}>, sua mensagem não está no formato certo, marujo.\n**Use os comandos corretamente, arr!**`;
                }
                message.channel.send(response)
                    .then((responseMessage) => {
                        setTimeout(() => {
                            responseMessage.delete().catch(console.error);
                        }, 10_000);
                    })
                    .catch(console.error);
            }
        }
    }
}
