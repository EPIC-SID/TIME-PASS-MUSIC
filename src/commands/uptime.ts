import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('Displays how long the bot has been online'),
    async execute(interaction: any) {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;
        const seconds = Math.floor(uptime % 60);

        const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('⏱️ System Uptime')
            .setDescription(`I have been online for: **${uptimeString}**`);

        await interaction.reply({ embeds: [embed] });
    },
};
