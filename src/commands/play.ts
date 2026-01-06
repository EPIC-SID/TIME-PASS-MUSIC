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

        // Check for playlist indicators in URL
        const isPlaylist = query.includes('list=') || query.includes('playlist') || query.includes('album');
        const searchMsg = isPlaylist ? '**🔄 Loading Playlist... (This may take a while)**' : '**🔎 Searching...**';

        const searchEmbed = new EmbedBuilder()
            .setColor('#5865F2') // Blurple for searching
            .setDescription(searchMsg);
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

            // Create a timeout promise to prevent hanging
            // Increased to 60s for large playlists
            const playPromise = distube.play(voiceChannel, query, {
                member: member,
                textChannel: interaction.channel
            });

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out. The playlist might be too large.')), 60000)
            );

            await Promise.race([playPromise, timeoutPromise]);

            // If successful, delete the searching message
            // We use deleteReply inside a try-catch to avoid errors if it's already deleted
            try {
                await interaction.deleteReply();
            } catch (e) {
                // Ignore delete errors
            }

        } catch (e) {
            console.error('[Play Command Error]', e);
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000') // Red
                .setTitle('❌ Error')
                .setDescription(`${e instanceof Error ? e.message : String(e)}`);

            // If interaction is still deferred/active, edit the reply to show error
            try {
                await interaction.editReply({ embeds: [errorEmbed] });
            } catch (err) {
                // If edit fails, try sending a new message
                interaction.channel?.send({ embeds: [errorEmbed] }).catch(() => { });
            }
        }
    },
};
