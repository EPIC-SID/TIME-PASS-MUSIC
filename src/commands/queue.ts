import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { distube } from '../client.js';

export default {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Shows the current music queue'),
    async execute(interaction: any) {
        const queue = distube.getQueue(interaction.guildId!);

        if (!queue || !queue.songs.length) {
            const emptyEmbed = new EmbedBuilder()
                .setColor('#95A5A6')
                .setDescription('**👻 The queue is currently empty!**');
            return interaction.reply({ embeds: [emptyEmbed], ephemeral: true });
        }

        const ITEMS_PER_PAGE = 10;
        // Songs excluding the current one (index 0)
        const upcomingSongs = queue.songs.slice(1);
        const totalPages = Math.ceil(upcomingSongs.length / ITEMS_PER_PAGE) || 1;
        let currentPage = 0;

        const generateEmbed = (page: number) => {
            const currentSong = queue.songs[0];
            const start = page * ITEMS_PER_PAGE;
            const end = start + ITEMS_PER_PAGE;
            const currentSegment = upcomingSongs.slice(start, end);

            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🎶 Current Queue')
                .setThumbnail(currentSong.thumbnail || null)
                .addFields({
                    name: '💿 Now Playing',
                    value: `**[${currentSong.name}](${currentSong.url})**\nDuration: \`${currentSong.formattedDuration}\` | Requested by: ${currentSong.user}`,
                    inline: false
                });

            if (currentSegment.length > 0) {
                const trackList = currentSegment.map((song, i) => {
                    // Calculate overall index: start + i + 1 (because 0 is playing)
                    return `**${start + i + 1}.** [${song.name}](${song.url}) - \`${song.formattedDuration}\` (${song.user})`;
                }).join('\n');
                embed.addFields({ name: `⏳ Up Next (Page ${page + 1}/${totalPages})`, value: trackList, inline: false });
            } else {
                embed.addFields({ name: '⏳ Up Next', value: 'No more songs in queue.', inline: false });
            }

            const totalDuration = queue.formattedDuration;
            const totalSongs = queue.songs.length;
            embed.setFooter({
                text: `Page ${page + 1}/${totalPages} | Total Songs: ${totalSongs} | Total Duration: ${totalDuration}`,
                iconURL: 'https://cdn.discordapp.com/emojis/995646193796333578.webp'
            });

            return embed;
        };

        const generateButtons = (page: number) => {
            const row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('queue_prev')
                        .setEmoji('⬅️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === 0),
                    new ButtonBuilder()
                        .setCustomId('queue_next')
                        .setEmoji('➡️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === totalPages - 1 || totalPages === 0)
                );
            return row;
        };

        const reply = await interaction.reply({
            embeds: [generateEmbed(currentPage)],
            components: [generateButtons(currentPage)],
            fetchReply: true
        });

        if (totalPages <= 1) return;

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000
        });

        collector.on('collect', async (i: any) => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: '❌ You cannot control this queue display!', ephemeral: true });
            }

            if (i.customId === 'queue_prev') {
                currentPage = Math.max(0, currentPage - 1);
            } else if (i.customId === 'queue_next') {
                currentPage = Math.min(totalPages - 1, currentPage + 1);
            }

            await i.update({
                embeds: [generateEmbed(currentPage)],
                components: [generateButtons(currentPage)]
            });
        });

        collector.on('end', () => {
            // Disable buttons on timeout
            const disabledRow = generateButtons(currentPage);
            disabledRow.components.forEach(btn => btn.setDisabled(true));
            interaction.editReply({ components: [disabledRow] }).catch(() => { });
        });
    },
};
