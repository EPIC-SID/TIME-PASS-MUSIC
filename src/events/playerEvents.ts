import { EmbedBuilder } from 'discord.js';
import { client, distube as distubeClient } from '../client.js';
import { Queue, Song, Playlist } from 'distube';
import { ConfigManager } from '../utils/configManager.js';
import { createMusicComponents, updateSetupMessage, resetSetupMessage } from '../utils/musicUtils.js';

const distube = distubeClient as any;

const status = (queue: Queue) =>
    `Volume: \`${queue.volume}%\` | Filter: \`${queue.filters.names.join(', ') || 'Off'}\` | Loop: \`${queue.repeatMode ? (queue.repeatMode === 2 ? 'All Queue' : 'This Song') : 'Off'
    }\` | Autoplay: \`${queue.autoplay ? 'On' : 'Off'}\``;

distube
    .on('playSong', async (queue: Queue, song: Song) => {
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

        // Progress Bar (Static at start)
        const progressBar = '🔘▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬';

        const embed = new EmbedBuilder()
            .setColor('#3B82F6') // Premium Blue
            .setAuthor({ name: 'NOW PLAYING 🎧', iconURL: 'https://bestanimations.com/media/discs/895872755cd-animated-gif-9.gif' })
            .setTitle(song.name || 'Unknown Title')
            .setURL(song.url || '')
            .setDescription(`
${progressBar} \`[0:00 / ${song.formattedDuration}]\`

**Requested By:** ${song.user}
**Duration:** \`${song.formattedDuration}\`
            `)
            .addFields(
                { name: '👤 Uploader', value: `\`${(song as any).uploader?.name || 'Unknown'}\``, inline: true },
                { name: '👀 Views', value: `\`${(song as any).views?.toLocaleString() || '0'}\``, inline: true },
                { name: '👍 Likes', value: `\`${(song as any).likes?.toLocaleString() || '0'}\``, inline: true }
            )
            .setImage(song.thumbnail || null) // Use big image for setup
            .setFooter({ text: statusString, iconURL: userIcon || undefined });

        // -- SETUP CHANNEL SYNC --
        // Use the shared utility to sync
        updateSetupMessage(queue);
        // ------------------------

        // If playing in setup channel, we don't send a separate message
        if (queue.textChannel?.id === ConfigManager.getSetupChannelId(queue.textChannel?.guild.id || '')) {
            return;
        }

        queue.textChannel?.send({
            embeds: [embed],
            components: createMusicComponents(queue)
        });
    })
    .on('addSong', (queue: Queue, song: Song) => {
        // Sync setup message (Queue count update)
        updateSetupMessage(queue);

        // Optional: Send ephemeral or temporary message in setup channel?
        // User asked for "sync", implies he wants the number to go up.
        // We probably don't want to spam the channel if it IS the setup channel.
        if (queue.textChannel?.id === ConfigManager.getSetupChannelId(queue.textChannel?.guild.id || '')) {
            // In setup channel, just sync the message (done above) and maybe delete user message (already handled in messageCreate)
            // We can send a temp "Added to queue" message if verified
            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setDescription(`⊕ Added **[${song.name}](${song.url})** to Queue`);
            queue.textChannel?.send({ embeds: [embed] }).then(msg => setTimeout(() => msg.delete().catch(() => { }), 3000));
        } else {
            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setDescription(`⊕ Added **[${song.name}](${song.url})** • ${song.formattedDuration} To Queue`);
            queue.textChannel?.send({ embeds: [embed] });
        }
    })
    .on('addList', (queue: Queue, playlist: Playlist) => {
        // Sync setup message
        updateSetupMessage(queue);

        if (queue.textChannel?.id === ConfigManager.getSetupChannelId(queue.textChannel?.guild.id || '')) {
            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setDescription(`✅ Playlist **[${playlist.name}](${playlist.url})** added (${playlist.songs.length} songs)`);
            queue.textChannel?.send({ embeds: [embed] }).then(msg => setTimeout(() => msg.delete().catch(() => { }), 3000));
        } else {
            const embed = new EmbedBuilder()
                .setColor('#2ECC71') // Green for success
                .setTitle('✅ Playlist Added')
                .setDescription(`**[${playlist.name}](${playlist.url})**`)
                .addFields(
                    { name: 'Songs', value: `\`${playlist.songs.length}\``, inline: true },
                    { name: 'Requested By', value: `${playlist.user}`, inline: true }
                );
            queue.textChannel?.send({ embeds: [embed] });
        }
    })
    .on('error', (error: any, queue: Queue) => {
        if (queue && queue.textChannel) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000') // Red
                .setTitle('❌ Error')
                .setDescription(error.toString().slice(0, 4096)); // Embed desc limit is 4096
            queue.textChannel.send({ embeds: [embed] });
        }
        console.error('[DisTube Error]', error);
    })
    .on('finish', async (queue: Queue) => {
        client.user?.setActivity({ name: 'Music 🎶', type: 2 }); // Reset status
        const is247 = ConfigManager.get247(queue.textChannel?.guild.id || '');
        const guildId = queue.textChannel?.guild.id;

        // Reset Setup Message
        if (guildId) {
            resetSetupMessage(guildId);
        }

        const embed = new EmbedBuilder()
            .setColor('#3498DB') // Blue
            .setDescription('🏁 **Queue finished!**');

        if (is247) {
            embed.setDescription('🏁 **Queue finished!** (24/7 Mode Active - Staying in VC)');
        } else {
            queue.voice.leave();
        }

        queue.textChannel?.send({ embeds: [embed] });
    })
    .on('disconnect', async (queue: Queue) => {
        client.user?.setActivity({ name: 'Music 🎶', type: 2 }); // Reset status

        const guildId = queue.textChannel?.guild.id;
        if (guildId) {
            resetSetupMessage(guildId);
        }

        const embed = new EmbedBuilder()
            .setColor('#E74C3C') // Red
            .setDescription('🔌 **Disconnected!**');
        queue.textChannel?.send({ embeds: [embed] });
    })
    .on('empty', (queue: Queue) => {
        const is247 = ConfigManager.get247(queue.textChannel?.guild.id || '');

        if (is247) {
            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setDescription('👻 **Channel is empty, but 24/7 mode is ON. Staying...**');
            queue.textChannel?.send({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setColor('#2B2D31') // Dark Grey
                .setDescription('👻 **Channel is empty. Leaving...**');
            queue.textChannel?.send({ embeds: [embed] });

            // Reset setup message if leaving
            const guildId = queue.textChannel?.guild.id;
            if (guildId) {
                resetSetupMessage(guildId);
            }

            queue.voice.leave();
        }
    })
    .on('initQueue', (queue: Queue) => {
        // Init queue
    })
    .on('debug', (message: string) => {
        // console.log('[DisTube Debug]', message); // Optional: Enable if needed
    })
    .on('ffmpegDebug', (text: string) => {
        console.log('[FFmpeg Debug]', text);
    });