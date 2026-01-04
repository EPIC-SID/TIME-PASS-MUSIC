import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { ConfigManager } from '../utils/configManager.js';

export default {
    data: new SlashCommandBuilder()
        .setName('prefix')
        .setDescription('Set a custom prefix for text commands')
        .addStringOption(option =>
            option.setName('new_prefix')
                .setDescription('The new prefix to set')
                .setRequired(true)),
    async execute(interaction: any) {
        if (!interaction.guildId) {
            return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        }

        const newPrefix = interaction.options.getString('new_prefix');
        ConfigManager.setPrefix(interaction.guildId, newPrefix);

        const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('🔡 Prefix Updated')
            .setDescription(`Successfully changed the bot prefix to: \`${newPrefix}\``);

        await interaction.reply({ embeds: [embed] });
    },
};
