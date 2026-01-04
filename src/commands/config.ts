import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { ConfigManager } from '../utils/configManager.js';

export default {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configure bot settings for the server'),
    async execute(interaction: any) {
        const currentPrefix = ConfigManager.getPrefix(interaction.guildId);

        const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('⚙️ Server Configuration')
            .setDescription('Current settings for this server:')
            .addFields(
                { name: 'Prefix', value: `\`${currentPrefix}\``, inline: true },
                { name: 'Language', value: '`English`', inline: true },
                { name: 'DJ Role', value: '`None`', inline: true }
            );

        await interaction.reply({ embeds: [embed] });
    },
};
