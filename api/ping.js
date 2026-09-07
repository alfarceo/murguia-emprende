import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // Ping simple para mantener Supabase activo
  const { data } = await supabase.from('users').select('id').limit(1);
  res.json({ ok: true, ts: new Date().toISOString(), rows: data?.length || 0 });
}
