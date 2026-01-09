import { SlashCommandBuilder, GuildMember, EmbedBuilder } from 'discord.js';
import { distube } from '../client.js';

export default {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stops the music and clears the queue'),
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
        if (!queue) {
            return interaction.reply({ content: '❌ No music playing!', ephemeral: true });
        }

        queue.stop();
        const embed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setDescription('**🛑 Playback stopped and queue cleared.**\nSee you next time!');

        return interaction.reply({ embeds: [embed] });
    },
};
