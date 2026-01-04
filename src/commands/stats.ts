import { SlashCommandBuilder, EmbedBuilder, version as djsVersion } from 'discord.js';
import os from 'os';

export default {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Displays technical statistics of the bot'),
    async execute(interaction: any) {
        const client = interaction.client;
        const totalGuilds = client.guilds.cache.size;
        const totalMembers = client.users.cache.size;

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('📊 Bot Statistics')
            .addFields(
                { name: 'Servers', value: `\`${totalGuilds}\``, inline: true },
                { name: 'Users', value: `\`${totalMembers}\``, inline: true },
                { name: 'Node.js', value: `\`${process.version}\``, inline: true },
                { name: 'Discord.js', value: `\`v${djsVersion}\``, inline: true },
                { name: 'Platform', value: `\`${os.platform()}\``, inline: true },
                { name: 'Memory Usage', value: `\`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\``, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
