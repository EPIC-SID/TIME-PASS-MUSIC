import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, GuildMember } from 'discord.js';
import { ConfigManager } from '../utils/configManager.js';
import { getSetupEmbed, getSetupComponents } from '../utils/musicUtils.js';

export default {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Creates a dedicated music request channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: any) {
        const guild = interaction.guild;
        if (!guild) return;

        // Check if already exists
        const existingChannelId = ConfigManager.getSetupChannelId(guild.id);
        if (existingChannelId) {
            const existingChannel = guild.channels.cache.get(existingChannelId);
            if (existingChannel) {
                return interaction.reply({ content: `⚠️ **Music Setup already exists!** Check <#${existingChannelId}>`, ephemeral: true });
            } else {
                // Config exists but channel missing - reset config
                ConfigManager.setSetupChannelId(guild.id, null);
                ConfigManager.setSetupMessageId(guild.id, null);
            }
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            // Create the channel
            const channel = await guild.channels.create({
                name: 'epic-tunes-requests',
                type: ChannelType.GuildText,
                topic: '🎵 **Music Request Channel** - Just type a song name to play!',
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
                    },
                    {
                        id: guild.members.me.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles]
                    }
                ]
            });

            // Create the Controller Embed using shared helper
            const embed = getSetupEmbed(guild);

            const message = await channel.send({ embeds: [embed], components: getSetupComponents() });

            // Save to Config
            ConfigManager.setSetupChannelId(guild.id, channel.id);
            ConfigManager.setSetupMessageId(guild.id, message.id);

            await interaction.editReply({ content: `✅ **Setup Complete!** Check out <#${channel.id}>` });

        } catch (error) {
            console.error('Setup Error:', error);
            await interaction.editReply({ content: '❌ Failed to create setup system. Check my permissions!' });
        }
    },
};

