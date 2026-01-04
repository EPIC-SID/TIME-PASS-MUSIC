import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Checks the bot\'s latency'),
    async execute(interaction: any) {
        const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiPing = interaction.client.ws.ping;

        const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('🏓 Pong!')
            .addFields(
                { name: 'Latency', value: `\`${latency}ms\``, inline: true },
                { name: 'API Latency', value: `\`${apiPing}ms\``, inline: true }
            );

        await interaction.editReply({ content: null, embeds: [embed] });
    },
};
