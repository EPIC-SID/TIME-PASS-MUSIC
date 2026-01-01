import { SlashCommandBuilder, EmbedBuilder, GuildMember } from 'discord.js';
import { useMainPlayer } from 'discord-player';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a song from YouTube, Spotify, etc.')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The song you want to play (link or name)')
                .setRequired(true)),
    async execute(interaction: any) {
        const player = useMainPlayer();
        const query = interaction.options.getString('query', true);
        const member = interaction.member as GuildMember;

        if (!member.voice.channel) {
            return interaction.reply({ content: 'You need to be in a voice channel to play music!', ephemeral: true });
        }

        await interaction.deferReply();

        try {
            const res = await player.play(member.voice.channel, query, {
                nodeOptions: {
                    metadata: interaction
                }
            });

            const embed = new EmbedBuilder()
                .setTitle('🎶 Added to Queue')
                .setDescription(`**${res.track.title}** has been added to the queue.`)
                .setThumbnail(res.track.thumbnail)
                .setColor('#00ff00');

            return interaction.editReply({ embeds: [embed] });
        } catch (e) {
            console.error(e);
            return interaction.editReply(`No results found for **${query}**!`);
        }
    },
};
