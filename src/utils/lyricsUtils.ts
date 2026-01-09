import { Client } from 'genius-lyrics';
import { EmbedBuilder } from 'discord.js';

const genius = new Client();

export const getSongLyrics = async (query: string) => {
    try {
        const searches = await genius.songs.search(query);
        if (!searches || searches.length === 0) {
            return null;
        }

        const song = searches[0];
        const lyrics = await song.lyrics();

        if (!lyrics) {
            return null;
        }

        return {
            title: song.title,
            artist: song.artist.name,
            thumbnail: song.thumbnail,
            lyrics: lyrics
        };
    } catch (e) {
        console.error('Error fetching lyrics:', e);
        return null;
    }
};

export const createLyricsEmbed = (data: { title: string, artist: string, thumbnail: string, lyrics: string }) => {
    return new EmbedBuilder()
        .setColor('#F1C40F')
        .setTitle(`Lyrics for ${data.title}`)
        .setThumbnail(data.thumbnail)
        .setDescription(data.lyrics.length > 4096 ? data.lyrics.substring(0, 4093) + '...' : data.lyrics)
        .setFooter({ text: `Provided by Genius • ${data.artist}` });
};
