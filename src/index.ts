import { client } from './client.js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { Collection, Events } from 'discord.js';
import http from 'http';

// -- Argument Parsing for Multi-Bot Support --
const args = process.argv.slice(2);
const envArg = args.find(arg => arg.startsWith('--env='));
const configArg = args.find(arg => arg.startsWith('--config='));

const envFile = envArg ? envArg.split('=')[1] : '.env';
if (envArg) console.log(`[Startup] Custom Env File: ${envFile}`);

dotenv.config({ path: envFile });

if (configArg) {
    const configFile = configArg.split('=')[1];
    process.env.CONFIG_FILE = path.resolve(configFile);
    console.log(`[Startup] Custom Config File: ${configFile}`);
}

// -- UPTIMEROBOT KEEP-ALIVE SYSTEM --
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write("Bot is Alive! 🤖");
    res.end();
}).listen(PORT, () => {
    console.log(`[Health-Check] Server running on port ${PORT}`);
});
// ------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import player events (this will register DisTube event listeners)
await import('./events/playerEvents.js');
// Import interaction handler for buttons
await import('./events/interactionHandler.js');

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
console.log(`${commandFiles.length} Slash Commands Loaded`);
console.log(`${commandFiles.length} Message Commands Loaded`);
console.log(`4 Events Loaded`);

// Event handler for slash commands
client.on(Events.InteractionCreate, async interaction => {
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

client.once(Events.ClientReady, async () => {
    const botName = process.env.BOT_NAME || 'EPIC TUNES';

    if (botName === 'MFS MUSIC') {
        console.log(`
███╗   ███╗███████╗███████╗    ███╗   ███╗██╗   ██╗███████╗██╗ ██████╗ 
████╗ ████║██╔════╝██╔════╝    ████╗ ████║██║   ██║██╔════╝██║██╔════╝ 
██╔████╔██║█████╗  ███████╗    ██╔████╔██║██║   ██║███████╗██║██║      
██║╚██╔╝██║██╔══╝  ╚════██║    ██║╚██╔╝██║██║   ██║╚════██║██║██║      
██║ ╚═╝ ██║██║     ███████║    ██║ ╚═╝ ██║╚██████╔╝███████║██║╚██████╗ 
╚═╝     ╚═╝╚═╝     ╚══════╝    ╚═╝     ╚═╝ ╚═════╝ ╚══════╝╚═╝ ╚═════╝ 
`);
    } else {
        console.log(`
███████╗██████╗ ██╗ ██████╗    ████████╗██╗   ██╗███╗   ██╗███████╗███████╗
██╔════╝██╔══██╗██║██╔════╝    ╚══██╔══╝██║   ██║████╗  ██║██╔════╝██╔════╝
█████╗  ██████╔╝██║██║            ██║   ██║   ██║██╔██╗ ██║█████╗  ███████╗
██╔══╝  ██╔═══╝ ██║██║            ██║   ██║   ██║██║╚██╗██║██╔══╝  ╚════██║
███████╗██║     ██║╚██████╗       ██║   ╚██████╔╝██║ ╚████║███████╗███████║
╚══════╝╚═╝     ╚═╝ ╚═════╝       ╚═╝    ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚══════╝
`);
    }
    console.log(`${botName} IS ONLINE !!`);

    const commandData = (client as any).commands.map((c: any) => c.data.toJSON());

    try {
        console.log('Started refreshing guild (/) commands.');

        // Register Globally (Primary)
        // Register Globally (Primary)
        await client.application?.commands.set(commandData);

        // Clear per-guild commands to prevent duplicates (Global takes precedence)
        // ... (existing code for clearing guild commands) ...

        // Set Initial Status
        client.user?.setActivity({
            name: 'Music 🎶',
            type: 2 // ActivityType.Listening
        });
        const guilds = client.guilds.cache;
        for (const [id, guild] of guilds) {
            try {
                await guild.commands.set([]); // Clear guild commands
            } catch (error) {
                // Ignore per-guild errors via try-catch, or log
            }
        }

        console.log('Successfully reloaded guild (/) commands.');
    } catch (error) {
        console.error(error);
    }
});

import { ConfigManager } from './utils/configManager.js';
ConfigManager.load();

// Legacy Text Command Handler (Shim)
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const PREFIX = ConfigManager.getPrefix(message.guildId || '');
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    const command = (client as any).commands.get(commandName);
    if (!command) return;

    // Create a "Fake" Interaction object to reuse the slash command logic
    const interactionShim = {
        isChatInputCommand: () => true, // spoof check
        replied: false,
        deferred: false,
        member: message.member,
        user: message.author, // Fix: Add user property
        guildId: message.guildId,
        guild: message.guild, // Fix: Add guild property as help.ts uses it
        client: client,
        channel: message.channel,
        options: {
            getString: (name: string, required: boolean) => {
                // Determine logic based on command arg structure
                if (commandName === 'play' || commandName === 'filter') {
                    return args.join(' ');
                }
                // For other commands like /loop mode
                return args[0];
            },
            getInteger: (name: string) => parseInt(args[0]),
            // Add other types if needed
            get: (name: string) => ({ value: args.join(' ') }) // Fallback
        },
        reply: async (options: any) => {
            // Text commands don't support ephemeral, so strip it to allow viewing
            if (options.ephemeral) delete options.ephemeral;
            // Store the response into this object so editReply can use it
            try {
                (interactionShim as any).response = await message.reply(options);
                (interactionShim as any).replied = true;
                return (interactionShim as any).response;
            } catch (e) {
                console.error('Shim Reply Error:', e);
            }
        },
        editReply: async (options: any) => {
            if ((interactionShim as any).response) {
                return (interactionShim as any).response.edit(options);
            }
            // If no initial reply (deferred), send new one
            return message.reply(options);
        },
        followUp: async (options: any) => {
            return message.reply(options);
        },
        deferReply: async () => {
            (interactionShim as any).deferred = true;
            // Can send a placeholder "Thinking..." messages if desired
            return;
        },
        deleteReply: async () => {
            if ((interactionShim as any).response) {
                try {
                    return await (interactionShim as any).response.delete();
                } catch (e) {
                    console.error('Shim Delete Error:', e);
                }
            }
            return;
        }
    };

    try {
        console.log(`[Text Command] Executing ${commandName} for ${message.author.tag}`);
        await command.execute(interactionShim);
    } catch (error) {
        console.error(error);
        message.reply('There was an error while executing this command!');
    }
});

client.login(process.env.DISCORD_TOKEN);
