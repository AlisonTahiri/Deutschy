import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let env = '';
try { env += fs.readFileSync('.env', 'utf-8') + '\n'; } catch(e){}
try { env += fs.readFileSync('.env.local', 'utf-8') + '\n'; } catch(e){}

const getEnv = (key) => {
    const match = env.match(new RegExp(`^${key}=(.*)$`, 'm'));
    return match ? match[1].trim() : null;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const levelId = '7344d6d8-a833-4033-bb80-989f4dd71928'; // B2 level UUID
    const { data: lessons, error: leErr } = await supabase.from('lessons').select('id, name').eq('level_id', levelId);
    
    if (lessons && lessons.length > 0) {
        const lessonIds = lessons.map(l => l.id);
        const { data: parts, error: pErr } = await supabase.from('lesson_parts').select('id, lesson_id, name').in('lesson_id', lessonIds);
        
        if (parts && parts.length > 0) {
            const partIds = parts.map(p => p.id);
            const { data: words, error: wErr } = await supabase.from('lesson_words').select('*').in('part_id', partIds);
            console.log('Words fetched:', words?.length);
            
            // let's group words by part_id
            const partCounts = {};
            words.forEach(w => {
                partCounts[w.part_id] = (partCounts[w.part_id] || 0) + 1;
            });
            console.log("Words per part:");
            parts.forEach(p => {
                console.log(`${p.name} (${p.id}): ${partCounts[p.id] || 0} words`);
            });
        }
    }
}
run();
