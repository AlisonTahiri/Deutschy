---
name: generate-german-audio
description: Generates German audio for new conversations using the Gemini TTS API, uploads them to Supabase, and cleans up local files.
---

# Generate German Audio

This skill defines the workflow for generating German audio MP3 files for new conversations in the app using the Gemini TTS API. Because the Gemini free tier has rate limits, we use specific scripts and procedures.

## Workflow Steps

### 1. Create the Conversation Data
- Create a new conversation object in `src/data/conversationData.ts`.
- Ensure it contains a maximum of 20 messages (or chunk them in batches of 20).
- Assign a specific `soundId` to each message using the `{conversationId}_msg-{number}` convention.

### 2. Generate Audio (Gemini TTS API)
- Run the generation script: `bun run scripts/generate-audio.ts`
- The script automatically checks `.env` for `GEMINI_API_KEY` or `GEMINI_API_KEY_2`.
- It splits the requests between `gemini-2.5-flash-preview-tts` (10 requests) and `gemini-3.1-flash-tts-preview` (10 requests) to bypass the 10 Requests Per Day (RPD) limit per model.
- **Note:** It takes about ~22 seconds per message due to the 3 Requests Per Minute (RPM) rate limit. Total time for 20 messages is ~7 minutes.

### 3. Upload to Supabase Storage
- Once all local `.mp3` files are generated in `public/sounds/`, run the upload script: `bun run scripts/upload-audio.ts`
- This script uses the `SUPABASE_SERVICE_ROLE_KEY` from `.env` to upload the files to the `audio` bucket in Supabase (under the `conversations/` path).

### 4. Cleanup
- Since the app fetches the audio dynamically from Supabase Storage (configured in `useConversationSpeech.ts`), delete the local `.mp3` files to save space:
  `rm -rf public/sounds/`

## Tools & Requirements
- **FFmpeg**: Must be installed on the system (used internally by `generate-audio.ts` to convert PCM to MP3).
- **Supabase**: Requires the `audio` public bucket to exist and `SUPABASE_SERVICE_ROLE_KEY` configured in `.env`.
