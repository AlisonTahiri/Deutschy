/**
 * generate-audio.ts
 *
 * Generates MP3 audio files for conversation messages using Gemini TTS API.
 * Run with: bun run scripts/generate-audio.ts
 *
 * Prerequisites:
 *   1. Set GEMINI_API_KEY in .env
 *   2. ffmpeg installed (for PCM → MP3 conversion)
 *
 * Usage:
 *   bun run scripts/generate-audio.ts              # Generate missing audio only
 *   bun run scripts/generate-audio.ts --force       # Regenerate all audio
 *   bun run scripts/generate-audio.ts --dry-run     # Preview what would be generated
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';

// ──────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────

const GEMINI_MODEL = 'gemini-3.1-flash-tts-preview';
const SOUNDS_DIR = join(dirname(import.meta.dir), 'public', 'sounds');

// Voice assignment per gender — using distinct Gemini voices for natural differentiation
// These voices are multilingual and will produce German speech naturally
const VOICE_MAP: Record<string, string> = {
  female: 'Kore',    // Female-sounding voice
  male: 'Charon',    // Male-sounding voice
};

// Rate limiting: Gemini TTS has 3 RPM, 10 RPD limits
const DELAY_BETWEEN_REQUESTS_MS = 22_000; // ~3 RPM = 1 request every 20s, with buffer

// ──────────────────────────────────────────────
// Conversation data (mirrored from conversationData.ts)
// We inline this to avoid complex TS module resolution
// ──────────────────────────────────────────────

interface MessageToGenerate {
  soundId: string;
  text: string;
  gender: 'male' | 'female';
}

const MESSAGES: MessageToGenerate[] = [
  { soundId: 'b1-cafe-sommerferien_msg-01', text: 'Hey Markus! Schön, dich wiederzusehen! Wie war dein Sommer?', gender: 'female' },
  { soundId: 'b1-cafe-sommerferien_msg-02', text: 'Hallo Anna! Ja, es ist lange her. Mein Sommer war wirklich toll! Ich war zwei Wochen in Kroatien.', gender: 'male' },
  { soundId: 'b1-cafe-sommerferien_msg-03', text: 'Oh, wie schön! Kroatien ist wunderschön. Warst du am Meer?', gender: 'female' },
  { soundId: 'b1-cafe-sommerferien_msg-04', text: 'Ja, wir hatten ein kleines Apartment direkt am Strand in Split. Das Wasser war so klar!', gender: 'male' },
  { soundId: 'b1-cafe-sommerferien_msg-05', text: 'Das klingt traumhaft. Und was hast du dort gemacht? Nur Strand oder auch Ausflüge?', gender: 'female' },
  { soundId: 'b1-cafe-sommerferien_msg-06', text: 'Wir haben viel unternommen! Wir haben die Altstadt besichtigt und sind auch mit dem Boot zu einer kleinen Insel gefahren.', gender: 'male' },
  { soundId: 'b1-cafe-sommerferien_msg-07', text: 'Das hört sich super an! Und wie war das Essen dort?', gender: 'female' },
  { soundId: 'b1-cafe-sommerferien_msg-08', text: 'Fantastisch! Wir haben jeden Abend frischen Fisch gegessen. Und du? Was hast du im Sommer gemacht?', gender: 'male' },
  { soundId: 'b1-cafe-sommerferien_msg-09', text: 'Ich bin nach Berlin gefahren, um meine Schwester zu besuchen. Sie wohnt dort seit zwei Jahren.', gender: 'female' },
  { soundId: 'b1-cafe-sommerferien_msg-10', text: 'Cool! Berlin ist eine tolle Stadt. Wie hat es dir gefallen?', gender: 'male' },
  { soundId: 'b1-cafe-sommerferien_msg-11', text: 'Ich liebe Berlin! Wir waren im Museum, haben im Park gepicknickt und sind abends in ein tolles Restaurant gegangen.', gender: 'female' },
  { soundId: 'b1-cafe-sommerferien_msg-12', text: 'Klingt nach einem perfekten Urlaub. Hast du auch etwas Neues ausprobiert?', gender: 'male' },
  { soundId: 'b1-cafe-sommerferien_msg-13', text: 'Ja! Ich habe einen Kochkurs besucht. Wir haben gelernt, wie man typisches Berliner Essen kocht.', gender: 'female' },
  { soundId: 'b1-cafe-sommerferien_msg-14', text: 'Das ist ja cool! Was hast du gekocht?', gender: 'male' },
  { soundId: 'b1-cafe-sommerferien_msg-15', text: 'Currywurst und Kartoffelpuffer! Es hat wirklich Spaß gemacht.', gender: 'female' },
  { soundId: 'b1-cafe-sommerferien_msg-16', text: 'Ha ha, lecker! Sag mal, hast du schon Pläne für nächste Woche? Ich dachte, wir könnten zusammen ins Kino gehen.', gender: 'male' },
  { soundId: 'b1-cafe-sommerferien_msg-17', text: 'Ja, gerne! Am Samstag habe ich Zeit. Welchen Film möchtest du sehen?', gender: 'female' },
  { soundId: 'b1-cafe-sommerferien_msg-18', text: 'Es läuft ein neuer deutscher Film. Er soll sehr gut sein. Sollen wir uns um sieben Uhr vor dem Kino treffen?', gender: 'male' },
  { soundId: 'b1-cafe-sommerferien_msg-19', text: 'Perfekt! Um sieben passt mir gut. Ich freue mich schon darauf!', gender: 'female' },
  { soundId: 'b1-cafe-sommerferien_msg-20', text: 'Super, dann bis Samstag! Aber jetzt bestelle ich erstmal noch einen Kaffee. Möchtest du auch noch einen?', gender: 'male' },
  { soundId: 'b1-cafe-sommerferien_msg-21', text: 'Ja, einen Cappuccino bitte! Danke dir.', gender: 'female' },
];

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function loadApiKey(): string {
  const envPath = join(dirname(import.meta.dir), '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  const match = envContent.match(/^GEMINI_API_KEY=(.+)$/m);
  if (!match || !match[1].trim()) {
    console.error('❌ GEMINI_API_KEY not found in .env — please set it first.');
    console.error('   Get your key at: https://aistudio.google.com/apikey');
    process.exit(1);
  }
  return match[1].trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Write a WAV header for raw PCM data (16-bit, 24kHz, mono)
 */
function pcmToWav(pcmBuffer: Buffer): Buffer {
  const sampleRate = 24000;
  const bitsPerSample = 16;
  const numChannels = 1;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;
  const headerSize = 44;

  const header = Buffer.alloc(headerSize);

  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(dataSize + headerSize - 8, 4);
  header.write('WAVE', 8);

  // fmt sub-chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);          // sub-chunk size
  header.writeUInt16LE(1, 20);           // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  // data sub-chunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

/**
 * Convert WAV to MP3 using ffmpeg
 */
function wavToMp3(wavPath: string, mp3Path: string): void {
  execSync(`ffmpeg -y -i "${wavPath}" -codec:a libmp3lame -qscale:a 2 "${mp3Path}" 2>/dev/null`);
}

/**
 * Call Gemini TTS API to generate audio for given text
 */
async function generateAudio(
  apiKey: string,
  text: string,
  voiceName: string,
): Promise<Buffer> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [{ text }],
      },
    ],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName,
          },
        },
      },
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  const json = await response.json();

  // Extract base64-encoded audio from response
  const audioData = json?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioData) {
    throw new Error(`No audio data in response: ${JSON.stringify(json).slice(0, 500)}`);
  }

  return Buffer.from(audioData, 'base64');
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const forceRegenerate = args.includes('--force');
  const dryRun = args.includes('--dry-run');

  const apiKey = loadApiKey();

  // Ensure sounds directory exists
  mkdirSync(SOUNDS_DIR, { recursive: true });

  // Determine which messages need audio generated
  const toGenerate = MESSAGES.filter((msg) => {
    const mp3Path = join(SOUNDS_DIR, `${msg.soundId}.mp3`);
    if (existsSync(mp3Path) && !forceRegenerate) {
      console.log(`⏭️  Skipping ${msg.soundId} (already exists)`);
      return false;
    }
    return true;
  });

  if (toGenerate.length === 0) {
    console.log('\n✅ All audio files already exist. Use --force to regenerate.');
    return;
  }

  console.log(`\n🎙️  Generating ${toGenerate.length} audio files...`);
  console.log(`   Model: ${GEMINI_MODEL}`);
  console.log(`   Voices: Female → ${VOICE_MAP.female}, Male → ${VOICE_MAP.male}`);
  console.log(`   Output: ${SOUNDS_DIR}\n`);

  if (dryRun) {
    toGenerate.forEach((msg) => {
      console.log(`  📝 Would generate: ${msg.soundId}.mp3 (${msg.gender}) — "${msg.text.slice(0, 50)}..."`);
    });
    console.log('\n🔍 Dry run complete. Remove --dry-run to generate.');
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < toGenerate.length; i++) {
    const msg = toGenerate[i];
    const voiceName = VOICE_MAP[msg.gender];
    const mp3Path = join(SOUNDS_DIR, `${msg.soundId}.mp3`);
    const wavTmpPath = join(SOUNDS_DIR, `_tmp_${msg.soundId}.wav`);

    console.log(`[${i + 1}/${toGenerate.length}] 🔊 Generating: ${msg.soundId} (${msg.gender}/${voiceName})`);
    console.log(`   "${msg.text.slice(0, 60)}${msg.text.length > 60 ? '...' : ''}"`);

    try {
      // Call API
      const pcmData = await generateAudio(apiKey, msg.text, voiceName);

      // Convert PCM → WAV
      const wavData = pcmToWav(pcmData);
      writeFileSync(wavTmpPath, wavData);

      // Convert WAV → MP3
      wavToMp3(wavTmpPath, mp3Path);

      // Cleanup temp WAV
      try { execSync(`rm "${wavTmpPath}"`); } catch { /* ignore */ }

      const mp3Size = Math.round(existsSync(mp3Path)
        ? require('fs').statSync(mp3Path).size / 1024
        : 0
      );
      console.log(`   ✅ Saved: ${msg.soundId}.mp3 (${mp3Size}KB)\n`);
      successCount++;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`   ❌ Error: ${errorMsg}\n`);
      errorCount++;
      // Cleanup temp file on error
      try { execSync(`rm -f "${wavTmpPath}"`); } catch { /* ignore */ }
    }

    // Rate limit: wait between requests (skip delay after last request)
    if (i < toGenerate.length - 1) {
      console.log(`   ⏳ Waiting ${DELAY_BETWEEN_REQUESTS_MS / 1000}s (rate limit)...`);
      await sleep(DELAY_BETWEEN_REQUESTS_MS);
    }
  }

  console.log('\n' + '═'.repeat(50));
  console.log(`🎉 Done! Generated: ${successCount} | Errors: ${errorCount}`);
  console.log(`📁 Files saved to: ${SOUNDS_DIR}`);
  console.log('═'.repeat(50));
}

main().catch(console.error);
