import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { distube } from '../client.js';

export default {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clears the entire queue (except current song)'),

    async execute(interaction: any) {
        const queue = distube.getQueue(interaction.guildId!);

        if (!queue) {
            return interaction.reply({ content: '❌ No music is currently playing!', ephemeral: true });
        }

        try {
            queue.songs.splice(1); // Keep the first song (currently playing)

            const embed = new EmbedBuilder()
                .setColor('#E74C3C') // Red
                .setDescription('🧹 **Queue Cleared!** (Only the current song remains)');

            return interaction.reply({ embeds: [embed] });
        } catch (e) {
            console.error(e);
            return interaction.reply({ content: '❌ An error occurred while clearing the queue.', ephemeral: true });
        }
    },
};
