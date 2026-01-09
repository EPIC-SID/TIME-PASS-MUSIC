import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { distube } from '../client.js';

export default {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pauses the current song'),
    async execute(interaction: any) {
        // DJ Permission Check
        const { checkDJPermission } = require('../utils/permissionUtils.js');
        if (!checkDJPermission(interaction)) {
            return interaction.reply({ content: '❌ You need the **DJ Role** to use this command!', ephemeral: true });
        }

        const queue = distube.getQueue(interaction.guildId!);
        if (!queue) return interaction.reply({ content: '❌ No music playing!', ephemeral: true });

        if (queue.paused) {
            return interaction.reply({ content: '⚠️ The song is already paused!', ephemeral: true });
        }

        try {
            queue.pause();
            const embed = new EmbedBuilder()
                .setColor('#F1C40F')
                .setTitle('⏸️ Paused')
                .setDescription('**Playback has been paused.**\nUse `/resume` to continue the vibe.');

            return interaction.reply({ embeds: [embed] });
        } catch (e) {
            console.error(e);
            await interaction.reply({ content: `❌ Error: ${e}`, ephemeral: true });
        }
    },
};
