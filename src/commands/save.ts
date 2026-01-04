import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { distube } from '../client.js';

export default {
    data: new SlashCommandBuilder()
        .setName('save')
        .setDescription('Saves the current song to your DMs'),

    async execute(interaction: any) {
        const queue = distube.getQueue(interaction.guildId!);

        if (!queue) {
            return interaction.reply({ content: '❌ No music is currently playing!', ephemeral: true });
        }

        const song = queue.songs[0];

        try {
            const embed = new EmbedBuilder()
                .setColor('#F1C40F') // Gold
                .setTitle('💾 Saved Song!')
                .setThumbnail(song.thumbnail || null)
                .setDescription(`You saved **[${song.name}](${song.url})**`)
                .addFields(
                    { name: 'Duration', value: song.formattedDuration || 'Unknown', inline: true },
                    { name: 'Uploader', value: song.uploader.name || 'Unknown', inline: true },
                    { name: 'Source', value: `[Link](${song.url})`, inline: true }
                )
                .setFooter({ text: `Saved from ${interaction.guild?.name}` });

            await interaction.user.send({ embeds: [embed] });
            return interaction.reply({ content: '✅ I sent the song to your DMs!', ephemeral: true });

        } catch (e) {
            console.error(e);
            return interaction.reply({ content: '❌ I couldn\'t DM you! Do you have DMs closed?', ephemeral: true });
        }
    },
};
