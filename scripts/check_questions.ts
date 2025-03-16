const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQuestions() {
  const { data, error } = await supabase
    .from('questions')
    .select('*');

  if (error) {
    console.error('Error fetching questions:', error);
    return;
  }

  console.log('Questions in database:', JSON.stringify(data, null, 2));
}

checkQuestions(); 