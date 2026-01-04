import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import { client, distube as distubeClient } from '../client.js';
import { Queue, Song, Playlist } from 'distube';

const distube = distubeClient as any;

const status = (queue: Queue) =>
    `Volume: \`${queue.volume}%\` | Filter: \`${queue.filters.names.join(', ') || 'Off'}\` | Loop: \`${queue.repeatMode ? (queue.repeatMode === 2 ? 'All Queue' : 'This Song') : 'Off'
    }\` | Autoplay: \`${queue.autoplay ? 'On' : 'Off'}\``;

// Helper to create components (Buttons + Select Menu)
const createMusicComponents = (queue: Queue) => {
    // Select Menu for Filters
    const filterRow = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('music_filter')
                .setPlaceholder('Click Here To Apply Filters')
                .addOptions([
                    { label: 'Off', value: 'off', description: 'Disable all filters' },
                    { label: '3D', value: '3d', description: 'Apply 3D effect' },
                    { label: 'Bassboost', value: 'bassboost', description: 'Boost the bass' },
                    { label: 'Echo', value: 'echo', description: 'Add echo effect' },
                    { label: 'Karaoke', value: 'karaoke', description: 'Karaoke mode' },
                    { label: 'Nightcore', value: 'nightcore', description: 'Speed up and pitch up' },
                    { label: 'Vaporwave', value: 'vaporwave', description: 'Slow down and pitch down' },
                ])
        );

    // Button Rows
    const row1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder().setCustomId('music_back').setEmoji('⏮').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('music_loop').setEmoji('🔁').setStyle(queue.repeatMode > 0 ? ButtonStyle.Success : ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('music_pause').setEmoji(queue.paused ? '▶' : '⏸').setStyle(queue.paused ? ButtonStyle.Success : ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('music_shuffle').setEmoji('🔀').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('music_next').setEmoji('⏭').setStyle(ButtonStyle.Secondary)
        );

    const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder().setCustomId('music_vol_down').setEmoji('🔉').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('music_queue').setEmoji('📑').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('music_stop').setEmoji('⏹').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('music_info').setEmoji('ℹ️').setStyle(ButtonStyle.Secondary), // Added Info button to match 10-button layout
            new ButtonBuilder().setCustomId('music_vol_up').setEmoji('🔊').setStyle(ButtonStyle.Secondary)
        );

    return [filterRow, row1, row2];
};

distube
    .on('playSong', (queue: Queue, song: Song) => {
        // Update Bot Status
        client.user?.setActivity({
            name: song.name?.substring(0, 120) || 'Music',
            type: 2 // ActivityType.Listening
        });

        // Status String for Footer
        const loopStatus = queue.repeatMode ? (queue.repeatMode === 2 ? 'Queue' : 'Song') : 'Off';
        const autoplayStatus = queue.autoplay ? 'On' : 'Off';
        const statusString = `Autoplay: ${autoplayStatus} • Loop: ${loopStatus} • Volume: ${queue.volume} • Queue: ${queue.songs.length - 1}`;

        const userIcon = song.user?.displayAvatarURL() || null;

        const embed = new EmbedBuilder()
            .setColor('#3B82F6') // Premium Blue
            .setAuthor({ name: 'NOW PLAYING', iconURL: 'https://cdn.discordapp.com/emojis/995646193796333578.webp' }) // Use a disc icon/emoji url
            .setTitle(song.name || 'Unknown Title')
            .setURL(song.url || '')
            .setDescription(`
• **Duration**: ${song.formattedDuration}
• **Requester**: ${song.user}
            `)
            .setThumbnail(song.thumbnail || null)
            .setFooter({ text: statusString, iconURL: userIcon || undefined });

        queue.textChannel?.send({
            embeds: [embed],
            components: createMusicComponents(queue)
        });
    })
    .on('addSong', (queue: Queue, song: Song) => {
        const embed = new EmbedBuilder()
            .setColor('#2ECC71') // Green for success
            .setDescription(`⊕ Added **[${song.name}](${song.url})** • ${song.formattedDuration} To Queue`);

        queue.textChannel?.send({ embeds: [embed] });
    })
    .on('addList', (queue: Queue, playlist: Playlist) => {
        const embed = new EmbedBuilder()
            .setColor('#2ECC71') // Green for success
            .setTitle('✅ Playlist Added')
            .setDescription(`**[${playlist.name}](${playlist.url})**`)
            .addFields(
                { name: 'Songs', value: `\`${playlist.songs.length}\``, inline: true },
                { name: 'Requested By', value: `${playlist.user}`, inline: true }
            );
        queue.textChannel?.send({ embeds: [embed] });
    })
    .on('error', (channel: any, e: any) => {
        if (channel && typeof channel.send === 'function') {
            const embed = new EmbedBuilder()
                .setColor('#FF0000') // Red
                .setTitle('❌ Error')
                .setDescription(e.toString().slice(0, 4096)); // Embed desc limit is 4096
            channel.send({ embeds: [embed] });
        }
        console.error('[DisTube Error]', e);
    })
    .on('finish', (queue: Queue) => {
        client.user?.setActivity({ name: 'Music 🎶', type: 2 }); // Reset status
        const embed = new EmbedBuilder()
            .setColor('#3498DB') // Blue
            .setDescription('🏁 **Queue finished!**');
        queue.textChannel?.send({ embeds: [embed] });
    })
    .on('disconnect', (queue: Queue) => {
        client.user?.setActivity({ name: 'Music 🎶', type: 2 }); // Reset status
        const embed = new EmbedBuilder()
            .setColor('#E74C3C') // Red
            .setDescription('🔌 **Disconnected!**');
        queue.textChannel?.send({ embeds: [embed] });
    })
    .on('empty', (queue: Queue) => {
        const embed = new EmbedBuilder()
            .setColor('#2B2D31') // Dark Grey
            .setDescription('👻 **Channel is empty. Leaving...**');
        queue.textChannel?.send({ embeds: [embed] });
    })
    .on('initQueue', (queue: Queue) => {
        // Init queue
    })
    .on('debug', (message: string) => {
        // Debug
    })
    .on('ffmpegDebug', (text: string) => {
        // FFmpeg Debug
    });