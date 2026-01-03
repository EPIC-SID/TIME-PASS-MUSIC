import { distube as distubeClient } from '../client.js';
import { Queue, Song, Playlist } from 'distube';

const distube = distubeClient as any;

distube
    .on('playSong', (queue: Queue, song: Song) => {
        console.log('[Event] playSong triggered');
        queue.textChannel?.send('🎶 Now playing: **' + song.name + '** - `' + song.formattedDuration + '` by ' + song.user);
    })
    .on('addSong', (queue: Queue, song: Song) => {
        console.log('[Event] addSong triggered');
        queue.textChannel?.send('✅ Added **' + song.name + '** - `' + song.formattedDuration + '` to the queue by ' + song.user);
    })
    .on('addList', (queue: Queue, playlist: Playlist) => {
        console.log('[Event] addList triggered');
        queue.textChannel?.send('✅ Added playlist **' + playlist.name + '** (' + playlist.songs.length + ' songs) to the queue by ' + playlist.user);
    })
    .on('error', (channel: any, e: any) => {
        console.log('[Event] error triggered');
        if (channel && typeof channel.send === 'function') {
            channel.send('❌ An error encountered: ' + e.toString().slice(0, 1974));
        }
        console.error('[DisTube Error]', e);
    })
    .on('finish', (queue: Queue) => {
        console.log('[Event] finish triggered');
        queue.textChannel?.send('🏁 Queue finished!');
    })
    .on('disconnect', (queue: Queue) => {
        console.log('[Event] disconnect triggered');
        queue.textChannel?.send('🔌 Disconnected!');
    })
    .on('empty', (queue: Queue) => {
        console.log('[Event] empty triggered');
        queue.textChannel?.send('Empty!');
    })
    .on('initQueue', (queue: Queue) => {
        console.log('[Event] initQueue triggered');
    })
    .on('debug', (message: string) => {
        console.log('[DisTube Debug]', message);
    })
    .on('ffmpegDebug', (text: string) => {
        console.log('[FFmpeg Debug]', text);
    });