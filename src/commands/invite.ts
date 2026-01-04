import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Get the invite link for the bot'),
    async execute(interaction: any) {
        // Generate dynamic invite link
        const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=8&scope=bot%20applications.commands`;

        const embed = new EmbedBuilder()
            .setColor('#E91E63')
            .setTitle('💌 Invite Me!')
            .setDescription('Click the button below to add me to your server.');

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Invite Link')
                    .setStyle(ButtonStyle.Link)
                    .setURL(inviteUrl)
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};
