/**
 * generate-audio.ts
 *
 * Generates MP3 audio files for conversation messages using Gemini TTS API.
 * Run with: bun run scripts/generate-audio.ts
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
import { conversations } from '../src/data/conversationData';

const SOUNDS_DIR = join(dirname(import.meta.dir), 'public', 'sounds');

const VOICE_MAP: Record<string, string> = {
  female: 'Kore',
  male: 'Charon',
};

const DELAY_BETWEEN_REQUESTS_MS = 22_000;

// Dynamic model selection to bypass 10 RPD per model limits
function getModel(index: number): string {
  // Use 2.5 for the first 10, 3.1 for the rest
  return index < 10 
    ? 'gemini-2.5-flash-preview-tts' 
    : 'gemini-3.1-flash-tts-preview';
}

function loadApiKey(): string {
  const envPath = join(dirname(import.meta.dir), '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  const match = envContent.match(/^GEMINI_API_KEY_2=(.+)$/m);
  if (!match || !match[1].trim()) {
    console.error('❌ GEMINI_API_KEY_2 not found in .env');
    process.exit(1);
  }
  return match[1].trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pcmToWav(pcmBuffer: Buffer): Buffer {
  const sampleRate = 24000;
  const bitsPerSample = 16;
  const numChannels = 1;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;
  const headerSize = 44;
  const header = Buffer.alloc(headerSize);

  header.write('RIFF', 0);
  header.writeUInt32LE(dataSize + headerSize - 8, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

function wavToMp3(wavPath: string, mp3Path: string): void {
  execSync(`ffmpeg -y -i "${wavPath}" -codec:a libmp3lame -qscale:a 2 "${mp3Path}" 2>/dev/null`);
}

async function generateAudio(apiKey: string, text: string, voiceName: string, model: string): Promise<Buffer> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`API error (${response.status}): ${await response.text()}`);
  }

  const json = await response.json();
  const audioData = json?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioData) {
    throw new Error(`No audio data in response.`);
  }

  return Buffer.from(audioData, 'base64');
}

async function main() {
  const apiKey = loadApiKey();
  mkdirSync(SOUNDS_DIR, { recursive: true });

  // Get only the picnic conversation
  const conv = conversations.find(c => c.id === 'b1-picknick-planung');
  if (!conv) {
    console.error('Conversation not found');
    return;
  }

  const toGenerate = conv.messages.map(msg => ({
    soundId: msg.soundId,
    text: msg.german,
    gender: conv.speakers.find(s => s.id === msg.speakerId)?.gender || 'female'
  })).filter(msg => {
    return !existsSync(join(SOUNDS_DIR, `${msg.soundId}.mp3`));
  });

  if (toGenerate.length === 0) {
    console.log('✅ All audio files exist.');
    return;
  }

  let reqIndex = 0;

  for (let i = 0; i < toGenerate.length; i++) {
    const msg = toGenerate[i];
    const voiceName = VOICE_MAP[msg.gender];
    const model = getModel(reqIndex); // 0-9 = 2.5, 10-19 = 3.1
    reqIndex++;

    const mp3Path = join(SOUNDS_DIR, `${msg.soundId}.mp3`);
    const wavTmpPath = join(SOUNDS_DIR, `_tmp_${msg.soundId}.wav`);

    console.log(`[${i + 1}/${toGenerate.length}] 🔊 Generating: ${msg.soundId} with ${model}`);
    
    try {
      const pcmData = await generateAudio(apiKey, msg.text, voiceName, model);
      writeFileSync(wavTmpPath, pcmToWav(pcmData));
      wavToMp3(wavTmpPath, mp3Path);
      try { execSync(`rm "${wavTmpPath}"`); } catch {}
      console.log(`   ✅ Saved: ${msg.soundId}.mp3\n`);
    } catch (err: unknown) {
      console.error(`   ❌ Error: ${err}\n`);
      try { execSync(`rm -f "${wavTmpPath}"`); } catch {}
    }

    if (i < toGenerate.length - 1) {
      console.log(`   ⏳ Waiting ${DELAY_BETWEEN_REQUESTS_MS / 1000}s...`);
      await sleep(DELAY_BETWEEN_REQUESTS_MS);
    }
  }
}

main().catch(console.error);
