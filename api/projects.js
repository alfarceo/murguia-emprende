import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, user_id, user_email, is_admin, project_id } = req.body || req.query;

  try {
    // GET all projects
    if (req.method === 'GET' && action === 'list') {
      let query = supabase.from('projects').select('*').order('updated_at', { ascending: false });
      if (!is_admin) query = query.eq('owner_email', user_email);
      const { data, error } = await query;
      if (error) throw error;
      return res.json({ projects: data });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // CREATE project
    if (action === 'create') {
      const { owner_name, owner_email: email } = req.body;
      const { data, error } = await supabase.from('projects').insert({
        owner_id: user_id,
        owner_name,
        owner_email: email,
        nombre: '',
        status: 'nuevo'
      }).select().single();
      if (error) throw error;
      return res.json({ project: data });
    }

    // SAVE form
    if (action === 'save_form') {
      const fields = req.body.fields || {};
      const { error } = await supabase.from('projects')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('id', project_id);
      if (error) throw error;
      return res.json({ ok: true });
    }

    // GET single project
    if (action === 'get') {
      const { data, error } = await supabase.from('projects').select('*, tasks(*)').eq('id', project_id).single();
      if (error) throw error;
      return res.json({ project: data });
    }

    // SAVE DJ session
    if (action === 'save_dj') {
      const { dj_messages, dj_step, dj_started, status } = req.body;
      const update = { dj_messages, dj_step, dj_started, updated_at: new Date().toISOString() };
      if (status) update.status = status;
      const { error } = await supabase.from('projects').update(update).eq('id', project_id);
      if (error) throw error;
      return res.json({ ok: true });
    }

    // SAVE memo
    if (action === 'save_memo') {
      const { memo, status } = req.body;
      const { error } = await supabase.from('projects')
        .update({ memo, status, updated_at: new Date().toISOString() })
        .eq('id', project_id);
      if (error) throw error;
      return res.json({ ok: true });
    }

    // ADD task
    if (action === 'add_task') {
      const { text, created_by } = req.body;
      const { data, error } = await supabase.from('tasks').insert({ project_id, text, created_by }).select().single();
      if (error) throw error;
      // Update project status
      await supabase.from('projects').update({ status: 'tarea', updated_at: new Date().toISOString() }).eq('id', project_id);
      return res.json({ task: data });
    }

    // TOGGLE task
    if (action === 'toggle_task') {
      const { task_id, done } = req.body;
      const { error } = await supabase.from('tasks').update({ done }).eq('id', task_id);
      if (error) throw error;
      return res.json({ ok: true });
    }

    // ADMIN: get all users
    if (action === 'admin_users') {
      const { data, error } = await supabase.from('users').select('id, name, email, is_admin, created_at').order('created_at');
      if (error) throw error;
      return res.json({ users: data });
    }

    return res.status(400).json({ error: 'Acción no reconocida' });
  } catch (e) {
    console.error('Projects error:', e);
    return res.status(500).json({ error: e.message });
  }
}
