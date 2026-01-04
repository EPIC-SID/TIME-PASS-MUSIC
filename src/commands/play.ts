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

        const searchEmbed = new EmbedBuilder()
            .setColor('#5865F2') // Blurple for searching
            .setDescription('**🔎 Searching YouTube...**');
        await interaction.reply({ embeds: [searchEmbed], ephemeral: true });

        try {
            const isUrl = /^(https?:\/\/)/.test(query);
            const isSpotifyTrack = query.includes('spotify.com/track/');
            const isYoutubeLink = query.includes('youtube.com') || query.includes('youtu.be');

            let videoTitle = 'Unknown Song';
            let videoUrl = query;
            let videoThumb = undefined;
            let videoDuration = 'Unknown';

            if (isSpotifyTrack) {
                try {
                    const response = await fetch(query);
                    const text = await response.text();
                    const titleMatch = text.match(/<title>(.*?)<\/title>/);

                    if (titleMatch && titleMatch[1]) {
                        let searchTerm = titleMatch[1].replace(' | Spotify', '').replace(' - song by', ' -').trim();
                        const searchResults = await yts(searchTerm);
                        if (searchResults && searchResults.videos.length > 0) {
                            const video = searchResults.videos[0];
                            query = video.url;
                        } else {
                            throw new Error('No YouTube match found');
                        }
                    }
                } catch (err) {
                    console.error('Spotify error:', err);
                    const errorEmbed = new EmbedBuilder().setColor('#FF0000').setDescription('❌ Could not resolve Spotify link.');
                    return interaction.editReply({ embeds: [errorEmbed] });
                }
            } else if (isYoutubeLink) {
                // Logic preserved, but no UI updates needed
            } else if (!isUrl) {
                const searchResults = await yts(query);
                if (!searchResults || !searchResults.videos.length) {
                    const errorEmbed = new EmbedBuilder().setColor('#FF0000').setDescription('❌ No results found.');
                    return interaction.editReply({ embeds: [errorEmbed] });
                }
                const video = searchResults.videos[0];
                query = video.url;
            }

            await distube.play(voiceChannel, query, {
                member: member,
                textChannel: interaction.channel
            });

            // Clean up the "Searching..." message
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
