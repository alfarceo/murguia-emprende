import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const ADMIN_EMAILS = ['alfarceo@gmail.com'];

function hashPass(pass) {
  return crypto.createHash('sha256').update(pass + process.env.PASS_SALT).digest('hex');
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, email, password, name } = req.body;
  const emailLower = (email || '').toLowerCase().trim();

  try {
    if (action === 'register') {
      if (!name || !email || !password) return res.status(400).json({ error: 'Faltan campos' });
      if (password.length < 4) return res.status(400).json({ error: 'Contraseña muy corta' });

      const { data: existing } = await supabase.from('users').select('id').eq('email', emailLower).single();
      if (existing) return res.status(400).json({ error: 'Este correo ya está registrado' });

      const { data: user, error } = await supabase.from('users').insert({
        email: emailLower,
        name,
        password_hash: hashPass(password),
        is_admin: ADMIN_EMAILS.includes(emailLower)
      }).select().single();

      if (error) throw error;
      return res.json({ user: { id: user.id, name: user.name, email: user.email, is_admin: user.is_admin } });
    }

    if (action === 'login') {
      if (!email || !password) return res.status(400).json({ error: 'Faltan campos' });

      const { data: user, error } = await supabase.from('users').select('*').eq('email', emailLower).single();
      if (error || !user) return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
      if (user.password_hash !== hashPass(password)) return res.status(401).json({ error: 'Correo o contraseña incorrectos' });

      return res.json({ user: { id: user.id, name: user.name, email: user.email, is_admin: user.is_admin } });
    }

    if (action === 'reset_password') {
      const { target_email, new_password } = req.body;
      if (!target_email || !new_password) return res.status(400).json({ error: 'Faltan campos' });
      if (new_password.length < 4) return res.status(400).json({ error: 'Contraseña muy corta' });

      const { error } = await supabase.from('users')
        .update({ password_hash: hashPass(new_password) })
        .eq('email', target_email.toLowerCase());

      if (error) throw error;
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: 'Acción no reconocida' });
  } catch (e) {
    console.error('Auth error:', e);
    return res.status(500).json({ error: e.message });
  }
}
