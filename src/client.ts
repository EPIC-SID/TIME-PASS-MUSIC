import { Client, GatewayIntentBits } from 'discord.js';
import { DisTube } from 'distube';
import { SpotifyPlugin } from '@distube/spotify';
import { SoundCloudPlugin } from '@distube/soundcloud';
import { YtDlpPlugin } from '@distube/yt-dlp';
import ffmpeg from 'ffmpeg-static';
import * as fs from 'fs';

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const cookies = (() => {
    try {
        if (fs.existsSync('./cookies.json')) {
            return JSON.parse(fs.readFileSync('./cookies.json', 'utf-8'));
        }
    } catch (e) {
        console.warn('Failed to load cookies.json:', e);
    }
    return undefined;
})();

export const distube = new DisTube(client, {
    emitNewSongOnly: false,
    ffmpeg: {
        path: ffmpeg || undefined
    },
    plugins: [
        new SpotifyPlugin(),
        new SoundCloudPlugin(),
        new YtDlpPlugin({
            cookies: cookies
        } as any)
    ]
} as any);

console.log(`[DEBUG] FFmpeg path: ${ffmpeg}`);