import { Client, GatewayIntentBits } from 'discord.js';
import { DisTube } from 'distube';
import { SpotifyPlugin } from '@distube/spotify';
import { SoundCloudPlugin } from '@distube/soundcloud';
// import { YtDlpPlugin } from '@distube/yt-dlp';
import { YtDlpPlugin } from './plugins/YtDlpPlugin.js'; // Use custom plugin to fix deprecated flag
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
        // 1. Check Local File (Development)
        if (fs.existsSync('./cookies.json')) {
            return JSON.parse(fs.readFileSync('./cookies.json', 'utf-8'));
        }
        // 2. Check Render Secret File (Production)
        if (fs.existsSync('/etc/secrets/cookies.json')) {
            console.log('[Startup] Loading cookies from Render Secret File.');
            return JSON.parse(fs.readFileSync('/etc/secrets/cookies.json', 'utf-8'));
        }
        // 3. Check Environment Variable (Fallback)
        if (process.env.YOUTUBE_COOKIES) {
            console.log('[Startup] Loading cookies from Environment Variable.');
            return JSON.parse(process.env.YOUTUBE_COOKIES);
        }
    } catch (e) {
        console.warn('Failed to load cookies:', e);
    }
    console.warn('[Startup] No cookies found. YouTube playback may fail on data center IPs.');
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