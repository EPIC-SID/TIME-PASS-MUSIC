import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Opens the help dashboard'),
    async execute(interaction: any) {
        const { client, guild } = interaction;

        // Stats
        const totalGuilds = client.guilds.cache.size;
        const uptime = process.uptime();
        const apiPing = client.ws.ping;
        const totalCommands = (client as any).commands.size;

        // Formatting Uptime
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;
        const seconds = Math.floor(uptime % 60);
        const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        // Footer Data
        const footer = {
            text: `Requested by ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL()
        };

        const homeEmbed = new EmbedBuilder()
            .setColor('#5865F2')
            .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() })
            .setTitle('🔥 Ultimate Music Experience')
            .setDescription(`**Yo, ready to drop the beat?** 🎧\nI'm **${client.user.username}**, your high-quality music companion.`)
            .addFields(
                {
                    name: '🎧 Music Controls',
                    value: '`/play`, `/pause`, `/resume`, `/stop`, `/skip`, `/previous`, `/seek`, `/autoplay`, `/loop`, `/shuffle`, `/filter`, `/nowplaying`, `/queue`',
                    inline: false
                },
                {
                    name: '🔰 Info & Utility',
                    value: '`/ping`, `/stats`, `/uptime`, `/invite`, `/help`, `/join`, `/leave`',
                    inline: false
                },
                {
                    name: '📊 System Status',
                    value: `>>> **Servers:** \`${totalGuilds}\`\n**Commands:** \`${totalCommands}\`\n**Ping:** \`${apiPing}ms\`\n**Uptime:** \`${uptimeString}\`\n\n**Made By:** [EPIC SID](https://discord.gg/ckHzTAM9Kj)`,
                    inline: false
                }
            )
            .setThumbnail(guild?.iconURL() || client.user.displayAvatarURL())
            .setFooter(footer);

        const musicEmbed = new EmbedBuilder()
            .setColor('#E91E63')
            .setTitle('🎹 Music Command Center')
            .setDescription('**Control the rhythm.** Use these commands to manage your listening session.')
            .addFields(
                { name: '▶️ Playback', value: '`/play`, `/pause`, `/resume`, `/stop`, `/skip`, `/previous`, `/seek`, `/autoplay`, `/loop`', inline: false },
                { name: '🎶 Queue Management', value: '`/queue`, `/nowplaying`, `/shuffle`', inline: false },
                { name: '🎛️ Audio Effects', value: '`/filter` (Bassboost, Nightcore, 8D, Vaporwave...)', inline: false }
            )
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter(footer);

        const infoEmbed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('🔰 Information Command Center')
            .setDescription('**Get to know me better.** Use these commands to check my status or invite me.')
            .addFields(
                { name: '🛠️ Utilities', value: '`/ping` - Check latency\n`/uptime` - Check run time\n`/stats` - View system specs', inline: false },
                { name: '💁 Support & Access', value: '`/help` - Show this menu\n`/invite` - Add me to your server', inline: false }
            )
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter(footer);

        const configEmbed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('⚙️ System Configuration')
            .setDescription('**Customize your server experience.**')
            .addFields(
                { name: '🔧 General Settings', value: '`/config` - View server settings\n`/prefix` - Change bot prefix\n`/reset` - Reset to defaults', inline: false }
            )
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter(footer);

        const buttonRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('home_btn')
                    .setEmoji('🏠')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('music_btn')
                    .setEmoji('🎵')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('info_btn')
                    .setEmoji('🔰')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('config_btn')
                    .setEmoji('⚙️')
                    .setStyle(ButtonStyle.Secondary)
            );

        const reply = await interaction.reply({ embeds: [homeEmbed], components: [buttonRow], fetchReply: true });

        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60000
        });

        collector.on('collect', async (i: any) => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: '❌ You cannot control this help menu!', ephemeral: true });
            }
            if (i.customId === 'home_btn') {
                await i.update({ embeds: [homeEmbed] });
            } else if (i.customId === 'music_btn') {
                await i.update({ embeds: [musicEmbed] });
            } else if (i.customId === 'info_btn') {
                await i.update({ embeds: [infoEmbed] });
            } else if (i.customId === 'config_btn') {
                await i.update({ embeds: [configEmbed] });
            }
        });

        collector.on('end', () => {
            const disabledRow = new ActionRowBuilder<ButtonBuilder>();
            buttonRow.components.forEach((btn: any) => disabledRow.addComponents(ButtonBuilder.from(btn).setDisabled(true)));
            interaction.editReply({ components: [disabledRow] }).catch(() => { });
        });
    },
};
