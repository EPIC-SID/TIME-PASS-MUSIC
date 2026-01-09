import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import { Queue } from 'distube';
import { client } from '../client.js';
import { ConfigManager } from './configManager.js';

export const createMusicComponents = (queue: Queue) => {
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
            new ButtonBuilder().setCustomId('music_info').setEmoji('ℹ️').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('music_vol_up').setEmoji('🔊').setStyle(ButtonStyle.Secondary)
        );

    return [filterRow, row1, row2];
};

export const getSetupComponents = () => {
    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('setup_refresh')
                .setLabel('Refresh Status')
                .setEmoji('🔄')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('setup_help')
                .setLabel('Help Guide')
                .setEmoji('❓')
                .setStyle(ButtonStyle.Success)
        );
    return [row];
};

export const updateSetupMessage = async (queue: Queue) => {
    const guildId = queue.textChannel?.guild.id;
    if (!guildId) return;

    const setupChannelId = ConfigManager.getSetupChannelId(guildId);
    const setupMessageId = ConfigManager.getSetupMessageId(guildId);

    if (!setupChannelId || !setupMessageId) return;

    try {
        const channel = client.channels.cache.get(setupChannelId) as any;
        if (!channel) return;

        const message = await channel.messages.fetch(setupMessageId).catch(() => null);
        if (!message) return;

        // If no song playing (e.g. stopped/empty), resetting handled elsewhere generally,
        // but if we call this, we assume a song is active or queue exists.
        if (!queue.songs.length) return; // Or reset?

        const song = queue.songs[0];

        // Status String for Footer
        const loopStatus = queue.repeatMode ? (queue.repeatMode === 2 ? 'Queue' : 'Song') : 'Off';
        const autoplayStatus = queue.autoplay ? 'On' : 'Off';
        const statusString = `Autoplay: ${autoplayStatus} • Loop: ${loopStatus} • Volume: ${queue.volume} • Queue: ${queue.songs.length - 1} • Duration: ${queue.formattedDuration}`;

        const userIcon = song.user?.displayAvatarURL() || null;
        const progressBar = '🔘▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬';

        const embed = new EmbedBuilder()
            .setColor('#3B82F6') // Premium Blue
            .setAuthor({ name: 'NOW PLAYING 🎧', iconURL: 'https://bestanimations.com/media/discs/895872755cd-animated-gif-9.gif' })
            .setTitle(song.name || 'Unknown Title')
            .setURL(song.url || '')
            .setDescription(`
${progressBar} \`[${queue.formattedCurrentTime} / ${song.formattedDuration}]\`

**Requested By:** ${song.user}
**Duration:** \`${song.formattedDuration}\`
            `)
            .addFields(
                { name: '👤 Uploader', value: `\`${(song as any).uploader?.name || 'Unknown'}\``, inline: true },
                { name: '👀 Views', value: `\`${(song as any).views?.toLocaleString() || '0'}\``, inline: true },
                { name: '👍 Likes', value: `\`${(song as any).likes?.toLocaleString() || '0'}\``, inline: true }
            )
            .setImage(song.thumbnail || null)
            .setFooter({ text: statusString, iconURL: userIcon || undefined });

        await message.edit({ embeds: [embed], components: createMusicComponents(queue) });

    } catch (e) {
        console.error('Failed to update setup message:', e);
    }
};

export const getSetupEmbed = (guild: any) => {
    const banner = guild.bannerURL({ size: 1024 }) || null;
    const icon = guild.iconURL() || client.user?.displayAvatarURL();

    // Modern Dashboard UI
    return new EmbedBuilder()
        .setColor('#2B2D31') // Discord Dark Mode Background - Seamless look
        .setImage(banner || 'https://i.pinimg.com/originals/26/32/38/2632382dc3d19e9104084c7946a4892c.gif') // Dynamic Server Banner
        .setDescription(`
# <a:musical_notes:123456789> NO MUSIC PLAYING
**Ready to vibe?** 
Join a voice channel and type your favorite **Song Name** or **Link** right here!

### __**Control Guide**__
> ⏯️ **Pause/Resume** • ⏹️ **Stop** • ⏭️ **Skip**
> 🔁 **Loop Mode** • 🔀 **Shuffle** • 📜 **Lyrics**
> 🔉/🔊 **Volume** • 👤 **Filters**

*Supports: YouTube • Spotify • SoundCloud • Apple Music*
        `)
        .setFooter({ text: 'EPIC TUNES • Advanced Music System', iconURL: icon || undefined });
};

export const resetSetupMessage = async (guildId: string) => {
    const setupChannelId = ConfigManager.getSetupChannelId(guildId);
    const setupMessageId = ConfigManager.getSetupMessageId(guildId);

    if (!setupChannelId || !setupMessageId) return;

    try {
        const channel = client.channels.cache.get(setupChannelId) as any;
        if (!channel) return;

        const message = await channel.messages.fetch(setupMessageId).catch(() => null);
        if (!message) return;

        const guild = client.guilds.cache.get(guildId);
        if (!guild) return;

        const embed = getSetupEmbed(guild);

        // Ensure clean state - with idle buttons
        await message.edit({ embeds: [embed], components: getSetupComponents() });

    } catch (e) {
        // If message not found/deleted, we should probably recreate it?
        // For now, let's try to just log it, but "Self-Healing" would check if error is "Unknown Message"
        // and send a new one.
        console.error('Failed to reset setup message:', e);

        // Simple Self-Healing: If we can't find the message, try to send a new one in that channel
        const channel = client.channels.cache.get(setupChannelId) as any;
        if (channel) {
            try {
                const guild = client.guilds.cache.get(guildId);
                if (guild) {
                    const embed = getSetupEmbed(guild);
                    const newMessage = await channel.send({ embeds: [embed], components: getSetupComponents() });
                    ConfigManager.setSetupMessageId(guildId, newMessage.id);
                    console.log('Self-Healed: Created new setup message.');
                }
            } catch (innerError) {
                console.error('Failed to self-heal setup message:', innerError);
            }
        }
    }
};

