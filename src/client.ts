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
    nsfw: true, // sometimes helps with restricted content
    ffmpeg: {
        path: ffmpeg || undefined,
        args: {
            global: {
                'reconnect': '1',
                'reconnect_streamed': '1',
                'reconnect_delay_max': '5',
                'reconnect_at_eof': '1',
                'reconnect_on_network_error': '1'
            }
        }
    },
    plugins: [
        new SpotifyPlugin(),
        // new SoundCloudPlugin(), // Rate limited
        new YtDlpPlugin({
            cookies: cookies,
            httpChunkSize: 1048576,
            ytdlOptions: {
                quality: 'highestaudio',
                highWaterMark: 1 << 25
            }
        } as any)
    ]
} as any);

console.log(`[DEBUG] FFmpeg path: ${ffmpeg}`);