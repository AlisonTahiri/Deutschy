import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
let supabaseUrl = '';
let supabaseKey = '';

envFile.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1];
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1];
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: levels } = await supabase.from('levels').select('*');
  console.log("Levels:", levels?.map(l => l.name));
  
  if (levels?.length) {
    const b2Level = levels.find(l => l.name === 'B2' || l.name.includes('B2'));
    if (b2Level) {
        const { data: methods } = await supabase.from('methods').select('*').eq('level_id', b2Level.id);
        console.log("Methods in B2:", methods?.map(m => m.name));
        if (methods?.length) {
            const { data: lessons } = await supabase.from('lessons').select('*').eq('method_id', methods[0].id);
            console.log("Lessons in first B2 method:", lessons?.map(l => l.name));
            
            const lesson8 = lessons?.find(l => l.name.includes('8'));
            if (lesson8) {
               const { data: parts } = await supabase.from('lesson_parts').select('*').eq('lesson_id', lesson8.id);
               console.log("Parts in Lesson 8:", parts);
            } else {
                console.log("Lesson 8 not found");
            }
        } else {
            console.log("No methods found for B2");
        }
    } else {
        console.log("B2 Level not found");
    }
  }
}

check();
