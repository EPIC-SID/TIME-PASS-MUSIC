# 🎵 EPIC TUNES

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Discord.js](https://img.shields.io/badge/Discord.js-5865F2?style=for-the-badge&logo=discord&logoColor=white)
![DisTube](https://img.shields.io/badge/DisTube-FE2C55?style=for-the-badge&logo=youtube&logoColor=white)

**EPIC TUNES** is a high-performance, feature-rich Discord music bot designed for seamless audio experiences. Built with modern web technologies, it features a professional **Interactive Dashboard**, 24/7 uptime capability, and a sleek user interface.

---

## ✨ Key Features

- **🎹 High-Quality Playback**:  
  Supports YouTube, Spotify, and SoundCloud with optimal audio buffering.
  
- **🎛️ Interactive Dashboard (`/help`)**:  
  Control everything from a single command!
  - `🏠 Home`: Real-time status overview.
  - `🎵 Music Center`: Dedicated controls for playback, queue, and filters.
  - `🔰 Info System`: Bot statistics and support.
  - `⚙️ Settings`: Configure per-server settings.

- **🛠️ Advanced Audio Filters**:  
  Apply real-time effects like `Bassboost`, `Nightcore`, `Vaporwave`, `3D`, and more.

- **⚙️ Custom Configuration**:  
  - Dynamic Prefix (`/prefix`) persistent per server.
  - Server-specific settings manageable via `/config`.

- **🚀 24/7 Ready**:  
  Built-in HTTP server for health checks (perfect for Render + UptimeRobot).

---

## 📥 Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.9.0 or higher)
- [FFmpeg](https://ffmpeg.org/download.html) (Installed and added to System PATH)

### Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/EPIC-SID/EPIC-TUNES.git
   cd EPIC-TUNES
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the root directory:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   PREFIX=?
   ```
   *(Optional)*: Create `cookies.json` for better YouTube support.

4. **Build and Run**
   ```bash
   npm run build
   npm start
   ```

---

## 🎮 Commands

### 🎵 Music Commands
| Command | Description |
|:---|:---|
| `/play <query>` | Play a song or playlist (YouTube/Spotify/SoundCloud). |
| `/stop` | Stop playback and clear the queue. |
| `/pause` | Pause the current track. |
| `/resume` | Resume playback. |
| `/skip` | Skip to the next song. |
| `/previous` | Go back to the previous song. |
| `/volume <0-100>` | Adjust the volume. |
| `/queue` | View the current song queue. |
| `/shuffle` | Shuffle the queue. |
| `/loop <off/song/queue>` | Toggle loop modes. |
| `/seek <seconds>` | Seek to a specific time. |
| `/autoplay` | Toggle autoplay mode. |
| `/filter <name>` | Apply audio effects (bassboost, nightcore, etc.). |
| `/nowplaying` | Show details of the current track. |
| `/join` | Summon the bot to your voice channel. |
| `/leave` | Disconnect the bot. |

### 🛠️ Utility & Config
| Command | Description |
|:---|:---|
| `/help` | Open the **Interactive Dashboard**. |
| `/ping` | Check bot latency. |
| `/stats` | View server/user counts and system memory. |
| `/uptime` | See how long the bot has been online. |
| `/invite` | Get an invite link for the bot. |
| `/config` | View server configuration. |
| `/prefix <new>` | Set a custom prefix for this server. |
| `/reset` | Reset server settings to default. |

---

## ☁️ Deployment (Free 24/7)

This bot is optimized for **Render**:
1. Create a **Web Service** on Render.
2. Set Build Command: `npm run build`
3. Set Start Command: `npm start`
4. Add Environment Variables (`DISCORD_TOKEN`, etc.).
5. Use **UptimeRobot** to ping the provided Render URL every 5 minutes.

---

## ❤️ Credits
Developed by **Siddhant** (EPIC SID).  
Powered by [DisTube](https://distube.js.org/).

---

> *Run nicely, play loud!* 🎸
