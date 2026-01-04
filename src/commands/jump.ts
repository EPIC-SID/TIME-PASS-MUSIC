import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { distube } from '../client.js';

export default {
    data: new SlashCommandBuilder()
        .setName('jump')
        .setDescription('Jump to a specific song in the queue')
        .addIntegerOption(option =>
            option.setName('position')
                .setDescription('The position to jump to')
                .setRequired(true)
                .setMinValue(1)),

    async execute(interaction: any) {
        const queue = distube.getQueue(interaction.guildId!);

        if (!queue) {
            return interaction.reply({ content: '❌ No music is currently playing!', ephemeral: true });
        }

        const position = interaction.options.getInteger('position');

        if (position >= queue.songs.length) {
            return interaction.reply({ content: `❌ Invalid position! The queue only has **${queue.songs.length - 1}** upcoming songs.`, ephemeral: true });
        }

        try {
            const song = await queue.jump(position);
            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setDescription(`⏭️ Jumped to **[${song.name}](${song.url})**`);

            return interaction.reply({ embeds: [embed] });
        } catch (e) {
            console.error(e);
            return interaction.reply({ content: '❌ An error occurred while trying to jump.', ephemeral: true });
        }
    },
};
