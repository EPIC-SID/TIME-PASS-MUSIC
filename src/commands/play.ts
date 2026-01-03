import { SlashCommandBuilder, GuildMember } from 'discord.js';
import { distube } from '../client.js';

export default {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a song from YouTube, Spotify, etc.')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The song you want to play (link or name)')
                .setRequired(true)),
    async execute(interaction: any) {
        const query = interaction.options.getString('query', true);
        const member = interaction.member as GuildMember;
        const voiceChannel = member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({ content: 'You need to be in a voice channel to play music!', ephemeral: true });
        }

        await interaction.reply({ content: '🔍 Searching and adding to queue...', ephemeral: true });

        try {
            await distube.play(voiceChannel, query, {
                member: member,
                textChannel: interaction.channel
            });
        } catch (e) {
            console.error('[Play Command Error]', e);
            return interaction.editReply({ content: `❌ Error: ${e instanceof Error ? e.message : e}` });
        }
    },
};
