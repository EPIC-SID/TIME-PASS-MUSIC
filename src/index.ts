import { client, player } from './client.js';
import { DefaultExtractors } from '@discord-player/extractor';
import { YoutubeiExtractor } from 'discord-player-youtubei';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { Collection } from 'discord.js';
import ffmpeg from 'ffmpeg-static';

// Explicitly set FFmpeg path
process.env.FFMPEG_PATH = ffmpeg || '';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load default extractors
await player.extractors.loadMulti(DefaultExtractors);
await player.extractors.register(YoutubeiExtractor, {
    streamOptions: {
        useClient: "ANDROID",
    }
});

// Import player events
await import('./events/playerEvents.js');

// Command handler setup
(client as any).commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => 
    (file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.d.ts')
);

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(`file://${filePath}`);
    if ('data' in command.default && 'execute' in command.default) {
        (client as any).commands.set(command.default.data.name, command.default);
    }
}

// Event handler for slash commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = (client as any).commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

client.on('ready', () => {
    console.log(`🚀 Bot is online as ${client.user?.tag}!`);
});

client.login(process.env.DISCORD_TOKEN);
