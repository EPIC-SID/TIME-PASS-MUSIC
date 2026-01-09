import { SlashCommandBuilder, EmbedBuilder, GuildMember } from 'discord.js';
import { distube } from '../client.js';

export default {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skips the current song'),
    async execute(interaction: any) {
        const member = interaction.member as GuildMember;

        if (!member.voice.channel) {
            return interaction.reply({ content: 'You need to be in a voice channel!', ephemeral: true });
        }

        // DJ Permission Check
        const { checkDJPermission } = require('../utils/permissionUtils.js');
        if (!checkDJPermission(interaction)) {
            return interaction.reply({ content: '❌ You need the **DJ Role** to use this command!', ephemeral: true });
        }

        const queue = distube.getQueue(interaction.guildId!);
        if (!queue) return interaction.reply({ content: '❌ No music playing!', ephemeral: true });

        try {
            const song = await queue.skip();
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setDescription(`**⏭️ Skipped!**\nNow playing: **${song.name}**`);
            return interaction.reply({ embeds: [embed] });
        } catch (e) {
            const embed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setDescription('**⚠️ Last song in queue.**\nType `/stop` to end or add more songs.');
            return interaction.reply({ embeds: [embed] });
        }
    },
};
