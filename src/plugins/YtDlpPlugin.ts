import { DisTubeError, PlayableExtractorPlugin, Playlist, Song } from 'distube';
import { spawn } from 'child_process';
import { request } from 'undici';
import fs from 'fs';
import path from 'path';
import dargs from 'dargs';

const YTDLP_DIR = path.join(process.cwd(), 'bin');
const YTDLP_IS_WINDOWS = process.platform === 'win32';
const YTDLP_FILENAME = `yt-dlp${YTDLP_IS_WINDOWS ? '.exe' : ''}`;
const YTDLP_PATH = path.join(YTDLP_DIR, YTDLP_FILENAME);
const YTDLP_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/' + YTDLP_FILENAME;

const makeRequest = async (url: string): Promise<any> => {
    const response = await request(url, { headers: { 'user-agent': 'distube' } });
    if (response.statusCode >= 400) throw new Error(`Cannot make requests to '${url}'`);
    if (response.statusCode >= 300 && response.headers.location) {
        return makeRequest(Array.isArray(response.headers.location) ? response.headers.location[0] : response.headers.location);
    }
    return response;
};

const download = async () => {
    if (fs.existsSync(YTDLP_PATH)) return;
    try {
        if (!fs.existsSync(YTDLP_DIR)) fs.mkdirSync(YTDLP_DIR, { recursive: true });
        const response = await makeRequest(YTDLP_URL);
        const buffer = await response.body.arrayBuffer();
        fs.writeFileSync(YTDLP_PATH, Buffer.from(buffer), { mode: 0o755 });
        console.log('[YtDlpPlugin] Downloaded yt-dlp binary');
    } catch (e) {
        console.error('[YtDlpPlugin] Failed to download yt-dlp:', e);
    }
};

const json = (url: string, flags: any) => {
    if (!fs.existsSync(YTDLP_PATH)) throw new Error('yt-dlp binary not found');
    const args = [url].concat(dargs(flags, { useEquals: false })).filter(Boolean);
    const child = spawn(YTDLP_PATH, args);
    return new Promise<any>((resolve, reject) => {
        let output = '';
        let error = '';
        child.stdout.on('data', d => output += d);
        child.stderr.on('data', d => error += d);
        child.on('close', code => {
            if (code === 0) {
                try {
                    resolve(JSON.parse(output));
                } catch (e) {
                    const jsonPart = output.substring(output.indexOf('{'));
                    resolve(JSON.parse(jsonPart));
                }
            } else {
                reject(new Error(error || 'Process failed'));
            }
        });
    });
};

const convertCookiesToNetscape = (cookies: any[]): string => {
    let output = '# Netscape HTTP Cookie File\n';
    if (!Array.isArray(cookies)) return '';

    for (const cookie of cookies) {
        if (!cookie.domain || !cookie.name || cookie.value === undefined) continue;

        const domain = cookie.domain;
        const flag = domain.startsWith('.') ? 'TRUE' : 'FALSE';
        const path = cookie.path || '/';
        const secure = cookie.secure ? 'TRUE' : 'FALSE';
        const expiration = cookie.expirationDate ? Math.round(cookie.expirationDate) : 0;
        const name = cookie.name;
        const value = cookie.value;

        output += `${domain}\t${flag}\t${path}\t${secure}\t${expiration}\t${name}\t${value}\n`;
    }
    return output;
};

class YtDlpSong extends Song {
    constructor(plugin: YtDlpPlugin, info: any, options: any = {}) {
        super(
            {
                plugin,
                source: info.extractor,
                playFromSource: true,
                id: info.id,
                name: info.title || info.fulltitle,
                url: info.webpage_url || info.original_url,
                isLive: info.is_live,
                thumbnail: info.thumbnail || info.thumbnails?.[0]?.url,
                duration: info.is_live ? 0 : info.duration,
                uploader: {
                    name: info.uploader,
                    url: info.uploader_url
                },
                views: info.view_count,
                likes: info.like_count,
                dislikes: info.dislike_count,
                reposts: info.repost_count,
                ageRestricted: Boolean(info.age_limit) && info.age_limit >= 18
            } as any,
            options
        );
    }
}

export class YtDlpPlugin extends PlayableExtractorPlugin {
    private cookiePath: string | undefined;

    constructor(options?: any) {
        super();
        download().catch(console.error);

        // Handle Cookies
        if (options?.cookies && Array.isArray(options.cookies)) {
            try {
                const netscapeCookies = convertCookiesToNetscape(options.cookies);
                if (netscapeCookies) {
                    this.cookiePath = path.join(process.cwd(), 'cookies.txt');
                    fs.writeFileSync(this.cookiePath, netscapeCookies);
                    console.log('[YtDlpPlugin] Converted JSON cookies to cookies.txt');
                }
            } catch (e) {
                console.error('[YtDlpPlugin] Failed to convert cookies:', e);
            }
        }
    }

    validate() { return true; }

    async resolve<T>(url: string, options: any): Promise<Song<T> | Playlist<T>> {
        // REMOVED: noCallHome: true
        const flags: any = {
            dumpSingleJson: true,
            noWarnings: true,
            preferFreeFormats: true,
            skipDownload: true,
            simulate: true,
            ...options?.ytdlOptions
        };

        if (this.cookiePath) {
            flags.cookies = this.cookiePath;
        }

        const info = await json(url, flags).catch((e: any) => {
            throw new DisTubeError('YTDLP_ERROR', `${e.message || e}`);
        });

        if (Array.isArray(info.entries)) { // Playlist
            return new Playlist({
                source: 'youtube',
                songs: info.entries.map((i: any) => new YtDlpSong(this, i, options)),
                name: info.title,
                url: info.webpage_url,
                thumbnail: info.thumbnails?.[0]?.url
            }, options) as Playlist<T>;
        }
        return new YtDlpSong(this, info, options) as unknown as Song<T>;
    }

    async getStreamURL(song: Song) {
        if (!song.url) {
            throw new DisTubeError('YTDLP_PLUGIN_INVALID_SONG', 'Cannot get stream url from invalid song.');
        }

        const flags: any = {
            dumpSingleJson: true,
            noWarnings: true,
            preferFreeFormats: true,
            skipDownload: true,
            simulate: true,
            format: 'ba/ba*'
        };

        if (this.cookiePath) {
            flags.cookies = this.cookiePath;
        }

        // REMOVED: noCallHome: true
        console.log('[YtDlpPlugin] Fetching stream URL for:', song.url);
        const info = await json(song.url, flags).catch((e: any) => {
            console.error('[YtDlpPlugin] Stream URL fetch failed:', e);
            throw new DisTubeError('YTDLP_ERROR', `${e.message || e}`);
        });
        console.log('[YtDlpPlugin] Stream URL found:', info.url ? 'Yes' : 'No');
        return info.url as string;
    }

    getRelatedSongs() {
        return [];
    }
}
