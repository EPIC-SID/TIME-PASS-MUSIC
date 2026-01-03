import { SlashCommandBuilder } from 'discord.js';
import { distube } from '../client.js';

export default {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resumes the paused song'),
    async execute(interaction: any) {
        const queue = distube.getQueue(interaction.guildId);
        if (!queue) {
            return interaction.reply({ content: '❌ There is nothing playing right now!', ephemeral: true });
        }
        if (!queue.paused) {
            return interaction.reply({ content: '▶️ The song is already playing!', ephemeral: true });
        }
        try {
            queue.resume();
            await interaction.reply('▶️ **Resumed**');
        } catch (e) {
            console.error(e);
            await interaction.reply({ content: `❌ Error: ${e}`, ephemeral: true });
        }
    },
};
