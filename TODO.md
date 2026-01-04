# Project Context & TODOs

## Current Project: TIME PASS MUSIC (Discord Music Bot)

### Progress Today (Thursday, 1 Jan 2026)
1.  **Fixed Dev Environment:** Corrected `package.json` to handle Windows shell quoting and ESM module loading (`node --loader ts-node/esm`).
2.  **Resolved Audio Encoding:** Fixed a native crash in `@discord-player/opus` by switching to `opusscript` and installing `sodium-native` for high-performance encryption.
3.  **Installed Extractors:** Discovered that YouTube extraction was missing in the default installation. Installed and registered `discord-player-youtubei`.
4.  **Added Enhanced Logging:** Modified `playerEvents.ts` and `play.ts` to provide verbose debug output for troubleshooting.

### The "Instant Finish" Bug
- **Symptoms:** The bot joins the voice channel, finds the correct track, but stops playing after exactly **120ms** of playback duration.
- **Key Error in Logs:** `[YOUTUBEJS][Player]: Failed to extract signature decipher algorithm.`
- **Hypothesis:** YouTube is successfully searched, but the actual stream URL is either invalid or blocked by YouTube's deciphering logic, causing FFmpeg to close the stream immediately.

### Next Steps for Music Bot
- [ ] Experiment with `useClient: "WEB_EMBEDDED"` or `"IOS"` in `YoutubeiExtractor` options.
- [ ] Enable verbose FFmpeg logging to check if it's a binary/codec issue.
- [ ] Investigate if cookies/authentication are required for YouTube (to bypass signature issues).
- [ ] Test with a non-YouTube direct MP3 link to confirm the core player logic is sound.

---