import { SlashCommandBuilder, GuildMember, EmbedBuilder } from 'discord.js';
import { distube } from '../client.js';
// @ts-ignore
import yts from 'yt-search';

export default {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a song from YouTube, Spotify, etc.')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The song you want to play (link or name)')
                .setRequired(true)),

    async execute(interaction: any) {
        let query = interaction.options.getString('query', true);
        const member = interaction.member as GuildMember;
        const voiceChannel = member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({ content: '❌ Connect to a voice channel first!', ephemeral: true });
        }

        // Defer reply immediately for better responsiveness
        await interaction.deferReply();

        const searchEmbed = new EmbedBuilder()
            .setColor('#5865F2') // Blurple for searching
            .setDescription('**🔎 Searching YouTube...**');
        await interaction.editReply({ embeds: [searchEmbed] });

        try {
            // Check if query is a URL
            const isUrl = /^(https?:\/\/)/.test(query);

            if (!isUrl) {
                // Manually search YouTube because native Distube search can be flaky ("NO_RESULT")
                const searchResults = await yts(query);
                if (!searchResults || !searchResults.videos.length) {
                    const errorEmbed = new EmbedBuilder().setColor('#FF0000').setDescription('❌ No results found.');
                    return interaction.editReply({ embeds: [errorEmbed] });
                }
                // Use the URL of the first result
                query = searchResults.videos[0].url;
            }

            await distube.play(voiceChannel, query, {
                member: member,
                textChannel: interaction.channel
            });

            // Delete the "Thinking..." reply (or change it to joined, but distube events handle the messages usually)
            await interaction.deleteReply();

        } catch (e) {
            console.error('[Play Command Error]', e);
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000') // Red
                .setTitle('❌ Error')
                .setDescription(`${e instanceof Error ? e.message : e}`);
            return interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
