import { SlashCommandBuilder, GuildMember } from 'discord.js';
import { useQueue } from 'discord-player';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skips the current song'),
    async execute(interaction: any) {
        const member = interaction.member as GuildMember;
        const queue = useQueue(interaction.guildId);

        if (!member.voice.channel) {
            return interaction.reply({ content: 'You need to be in a voice channel!', ephemeral: true });
        }

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({ content: 'There is no music playing!', ephemeral: true });
        }

        queue.node.skip();
        return interaction.reply('⏩ Skipped the current song!');
    },
};
