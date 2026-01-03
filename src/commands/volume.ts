import { SlashCommandBuilder } from 'discord.js';
import { distube } from '../client.js';

export default {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Sets the volume of the music player')
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('The volume level (0-100)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(100)),
    async execute(interaction: any) {
        const volume = interaction.options.getInteger('level');
        const queue = distube.getQueue(interaction.guildId);
        if (!queue) {
            return interaction.reply({ content: '❌ There is nothing playing right now!', ephemeral: true });
        }
        try {
            queue.setVolume(volume);
            await interaction.reply(`🔊 Volume set to **${volume}%**`);
        } catch (e) {
            console.error(e);
            await interaction.reply({ content: `❌ Error: ${e}`, ephemeral: true });
        }
    },
};
