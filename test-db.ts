import { supabase } from './src/lib/supabase';
async function run() {
  const { data: levels } = await supabase.from('levels').select('*');
  console.log("LEVELS:", levels);
  if (levels?.length > 0) {
    const { data: lessons } = await supabase.from('lessons').select('*').eq('level_id', levels[0].id);
    console.log("LESSONS for level 1:", lessons);
  }
}
run();
