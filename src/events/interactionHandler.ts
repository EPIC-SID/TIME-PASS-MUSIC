import { Events, Interaction } from 'discord.js';
import { client, distube } from '../client.js';
import { updateSetupMessage, resetSetupMessage } from '../utils/musicUtils.js';

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

    const customId = interaction.customId;
    if (!customId.startsWith('music_') && !customId.startsWith('setup_')) return;

    // Helper to get the queue for the guild
    const queue = distube.getQueue(interaction.guildId!);

    // For Setup buttons (Refresh/Help), we don't need a queue to be active
    if (customId.startsWith('setup_') && !customId.startsWith('setup_play_pause')) {
        // Let execution proceed to specific handlers below, jumping over queue checks
    } else {
        // Standard Music Control Checks
        if (!queue) {
            return interaction.reply({ content: '❌ No music is currently playing!', ephemeral: true });
        }

        // Permission check: Ensure user is in the same voice channel
        const member = interaction.member as any;
        if (!member.voice.channel || member.voice.channel.id !== queue.voiceChannel?.id) {
            return interaction.reply({ content: '❌ You need to be in the same voice channel as the bot!', ephemeral: true });
        }
    }

    try {
        if (interaction.isStringSelectMenu()) {
            if (customId === 'music_filter') {
                const filter = interaction.values[0];
                if (filter === 'off') {
                    queue?.filters?.clear();
                    await interaction.reply({ content: '✨ Cleared all filters.', ephemeral: true });
                } else {
                    // Toggle the filter or set it. DisTube's filter system is odd. 
                    // Usually queue.filters.add(filter) works if defined in config.
                    // We'll assume standard DisTube filters are available.
                    if (queue?.filters?.has(filter)) {
                        queue?.filters?.remove(filter);
                        await interaction.reply({ content: `❌ Filter/Effect Removed: **${filter}**`, ephemeral: true });
                    } else {
                        queue?.filters?.add(filter);
                        await interaction.reply({ content: `✨ Filter/Effect Applied: **${filter}**`, ephemeral: true });
                    }
                }
            }
            return;
        }

        // Handle Setup Idle Buttons (Refresh / Help)
        if (customId === 'setup_refresh') {
            await interaction.deferUpdate();
            // Manually trigger a reset to ensure latest UI
            await resetSetupMessage(interaction.guildId!);
            // Ephemeral confirmation - actually deferUpdate is often enough if we edit message
            // but here we might just want to reply confidentially
            await interaction.followUp({ content: '🔄 Setup status refreshed!', ephemeral: true });
            return;
        }

        if (customId === 'setup_help') {
            await interaction.reply({
                content: `
### 📘 Quick Guide
- **Play Music**: Just type the song name or link in this channel!
- **Buttons**: Use the controls below the "Now Playing" message.
- **Commands**: Type \`/\` to see all available commands like \`/filter\`, \`/loop\`, etc.
                 `,
                ephemeral: true
            });
            return;
        }

        // Normalize IDs to share logic
        // setup_play_pause -> music_pause (or generic toggle)
        let action = customId;
        if (customId.startsWith('setup_')) {
            const suffix = customId.replace('setup_', '');
            // Map setup suffixes to music actions
            const map: { [key: string]: string } = {
                'play_pause': 'music_pause',
                'stop': 'music_stop',
                'skip': 'music_next',
                'loop': 'music_loop',
                'shuffle': 'music_shuffle',
                'vol_down': 'music_vol_down',
                'vol_up': 'music_vol_up',
                'lyrics': 'music_lyrics'
            };
            action = map[suffix] || customId;
        }

        switch (action) {
            case 'music_lyrics':
                // Shared Lyrics Logic
                const currentSongForLyrics = queue?.songs[0];
                if (!currentSongForLyrics) return interaction.reply({ content: '❌ No song playing!', ephemeral: true });

                await interaction.deferReply({ ephemeral: true });
                try {
                    const { getSongLyrics, createLyricsEmbed } = require('../utils/lyricsUtils.js');
                    const result = await getSongLyrics(currentSongForLyrics.name);
                    if (!result) {
                        await interaction.editReply({ content: `❌ No lyrics found for **${currentSongForLyrics.name}**` });
                    } else {
                        const embed = createLyricsEmbed(result);
                        await interaction.editReply({ embeds: [embed] });
                    }
                } catch (e) {
                    await interaction.editReply({ content: '❌ Failed to fetch lyrics.' });
                }
                break;

            // For control actions, check DJ Perms - Explicitly repeated for safety/clarity
            case 'music_back':
                {
                    const { checkDJPermission } = require('../utils/permissionUtils.js');
                    if (!checkDJPermission(interaction)) return interaction.reply({ content: '❌ You need the **DJ Role** to use this button!', ephemeral: true });

                    if (queue && queue.previousSongs.length > 0) {
                        await queue.previous();
                        await interaction.reply({ content: '⏮️ Went back to previous song!', ephemeral: true });
                    } else {
                        await interaction.reply({ content: '❌ No previous song found.', ephemeral: true });
                    }
                }
                break;

            case 'music_next':
                {
                    const { checkDJPermission } = require('../utils/permissionUtils.js');
                    if (!checkDJPermission(interaction)) return interaction.reply({ content: '❌ You need the **DJ Role** to use this button!', ephemeral: true });

                    if (queue && queue.songs.length > 1) {
                        await queue.skip();
                        await interaction.reply({ content: '⏭️ Skipped song!', ephemeral: true });
                    } else {
                        await interaction.reply({ content: '❌ No more songs in queue. Use Stop button to end.', ephemeral: true });
                    }
                }
                break;

            case 'music_pause':
                {
                    const { checkDJPermission } = require('../utils/permissionUtils.js');
                    if (!checkDJPermission(interaction)) return interaction.reply({ content: '❌ You need the **DJ Role** to use this button!', ephemeral: true });

                    if (queue?.paused) {
                        queue.resume();
                        await interaction.reply({ content: '▶️ Resumed!', ephemeral: true });
                    } else {
                        queue?.pause();
                        await interaction.reply({ content: '⏸️ Paused!', ephemeral: true });
                    }
                }
                break;

            case 'music_stop':
                {
                    const { checkDJPermission } = require('../utils/permissionUtils.js');
                    if (!checkDJPermission(interaction)) return interaction.reply({ content: '❌ You need the **DJ Role** to use this button!', ephemeral: true });

                    queue?.stop();
                    await interaction.reply({ content: '🛑 Stopped music and cleared queue.', ephemeral: true });
                    resetSetupMessage(interaction.guildId!);
                }
                break;

            case 'music_shuffle':
                {
                    const { checkDJPermission } = require('../utils/permissionUtils.js');
                    if (!checkDJPermission(interaction)) return interaction.reply({ content: '❌ You need the **DJ Role** to use this button!', ephemeral: true });

                    queue?.shuffle();
                    await interaction.reply({ content: '🔀 Shuffled queue!', ephemeral: true });
                }
                break;

            case 'music_loop':
                {
                    const { checkDJPermission } = require('../utils/permissionUtils.js');
                    if (!checkDJPermission(interaction)) return interaction.reply({ content: '❌ You need the **DJ Role** to use this button!', ephemeral: true });

                    if (!queue) return;
                    // Mode: 0 = Off, 1 = Song, 2 = Queue
                    const nextMode = (queue.repeatMode + 1) % 3;
                    queue.setRepeatMode(nextMode);
                    const modeName = nextMode === 0 ? 'Off' : nextMode === 1 ? 'Song' : 'Queue';
                    await interaction.reply({ content: `🔁 Loop mode set to: **${modeName}**`, ephemeral: true });
                    updateSetupMessage(queue);
                }
                break;

            case 'music_vol_down':
                {
                    const { checkDJPermission } = require('../utils/permissionUtils.js');
                    if (!checkDJPermission(interaction)) return interaction.reply({ content: '❌ You need the **DJ Role** to use this button!', ephemeral: true });

                    if (!queue) return;
                    const volDown = Math.max(0, queue.volume - 10);
                    queue.setVolume(volDown);
                    await interaction.reply({ content: `🔉 Volume decrease to ${volDown}%`, ephemeral: true });
                    updateSetupMessage(queue);
                }
                break;

            case 'music_vol_up':
                {
                    const { checkDJPermission } = require('../utils/permissionUtils.js');
                    if (!checkDJPermission(interaction)) return interaction.reply({ content: '❌ You need the **DJ Role** to use this button!', ephemeral: true });

                    if (!queue) return;
                    const volUp = Math.min(100, queue.volume + 10);
                    queue.setVolume(volUp);
                    await interaction.reply({ content: `🔊 Volume increased to ${volUp}%`, ephemeral: true });
                    updateSetupMessage(queue);
                }
                break;

            // Lyrics handled above
            /* case 'music_lyrics': */

            case 'music_queue':
                if (!queue) return;
                const qDocs = queue.songs.slice(0, 10).map((s, i) => {
                    return `**${i + 1}.** [${s.name}](${s.url}) - \`${s.formattedDuration}\``;
                }).join('\n');

                await interaction.reply({
                    embeds: [{
                        color: 0x5865F2, // Blurple for Queue
                        title: '📜 Current Queue (Top 10)',
                        description: qDocs || 'No songs in queue.',
                        footer: { text: `Total Songs: ${queue.songs.length} | Total Duration: ${queue.formattedDuration}` }
                    }],
                    ephemeral: true
                });
                break;

            case 'music_info':
                if (!queue) return;
                const currentSong = queue.songs[0];
                await interaction.reply({
                    embeds: [{
                        color: 0x3498DB, // Blue for Info
                        title: 'ℹ️ Song Info',
                        thumbnail: { url: currentSong?.thumbnail || '' },
                        fields: [
                            { name: 'Title', value: currentSong?.name || 'Unknown', inline: true },
                            { name: 'Duration', value: currentSong?.formattedDuration || 'Unknown', inline: true },
                            { name: 'Views', value: (currentSong?.views || 0).toString(), inline: true },
                            { name: 'Likes', value: (currentSong?.likes || 0).toString(), inline: true },
                            { name: 'Uploader', value: (currentSong?.uploader && typeof currentSong.uploader === 'object') ? (currentSong.uploader.name || 'Unknown') : String(currentSong?.uploader || 'Unknown'), inline: true },
                            { name: 'Source', value: currentSong?.source || 'Unknown', inline: true }
                        ]
                    }],
                    ephemeral: true
                });
                break;
        }
    } catch (error) {
        console.error('Interaction Handler Error:', error);
        if (!interaction.replied) {
            await interaction.reply({ content: '❌ An error occurred processing that button.', ephemeral: true });
        }
    }
});
