/**
 * upload-audio.ts
 *
 * Uploads all MP3 files from public/sounds/ to Supabase Storage.
 * Run with: bun run scripts/upload-audio.ts
 *
 * Prerequisites:
 *   1. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 *   2. The `audio` bucket must exist in Supabase.
 */

import { createClient } from '@supabase/supabase-js';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';

// Load env vars manually for the script
const envPath = join(dirname(import.meta.dir), '.env');
const envContent = existsSync(envPath) ? readFileSync(envPath, 'utf-8') : '';

function getEnv(key: string): string {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match && match[1] ? match[1].trim() : '';
}

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY'); // Use service role for upload bypassing RLS

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const SOUNDS_DIR = join(dirname(import.meta.dir), 'public', 'sounds');

async function main() {
  if (!existsSync(SOUNDS_DIR)) {
    console.error(`❌ Sounds directory not found: ${SOUNDS_DIR}`);
    return;
  }

  const files = readdirSync(SOUNDS_DIR).filter(f => f.endsWith('.mp3'));
  
  if (files.length === 0) {
    console.log('No MP3 files found to upload.');
    return;
  }

  console.log(`Found ${files.length} MP3 files. Starting upload to Supabase...`);

  let success = 0;
  let errors = 0;

  for (const file of files) {
    const filePath = join(SOUNDS_DIR, file);
    const fileBuffer = readFileSync(filePath);
    const storagePath = `conversations/${file}`;

    console.log(`⬆️ Uploading ${file}...`);
    const { data, error } = await supabase.storage
      .from('audio')
      .upload(storagePath, fileBuffer, {
        contentType: 'audio/mpeg',
        upsert: true, // Overwrite if exists
      });

    if (error) {
      console.error(`❌ Error uploading ${file}:`, error.message);
      errors++;
    } else {
      success++;
    }
  }

  console.log(`\n🎉 Upload complete: ${success} successful, ${errors} errors.`);
}

main().catch(console.error);
