import { SlashCommandBuilder, GuildMember } from 'discord.js';
import { useQueue } from 'discord-player';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stops the music and clears the queue'),
    async execute(interaction: any) {
        const member = interaction.member as GuildMember;
        const queue = useQueue(interaction.guildId);

        if (!member.voice.channel) {
            return interaction.reply({ content: 'You need to be in a voice channel!', ephemeral: true });
        }

        if (!queue) {
            return interaction.reply({ content: 'There is no music playing!', ephemeral: true });
        }

        queue.delete();
        return interaction.reply('🛑 Stopped the music and disconnected!');
    },
};
