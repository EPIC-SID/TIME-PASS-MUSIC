import { SlashCommandBuilder } from 'discord.js';
import { distube } from '../client.js';

export default {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pauses the current song'),
    async execute(interaction: any) {
        const queue = distube.getQueue(interaction.guildId);
        if (!queue) {
            return interaction.reply({ content: '❌ There is nothing playing right now!', ephemeral: true });
        }
        if (queue.paused) {
            return interaction.reply({ content: '⏸️ The song is already paused!', ephemeral: true });
        }
        try {
            queue.pause();
            await interaction.reply('⏸️ **Paused**');
        } catch (e) {
            console.error(e);
            await interaction.reply({ content: `❌ Error: ${e}`, ephemeral: true });
        }
    },
};
