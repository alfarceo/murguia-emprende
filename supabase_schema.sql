-- ═══════════════════════════════════════════════
-- MURGUÍA EMPRENDE — Supabase Database Schema
-- Ejecuta este SQL en el SQL Editor de Supabase
-- ═══════════════════════════════════════════════

-- Habilitar UUID
create extension if not exists "uuid-ossp";

-- ── USUARIOS ──
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text not null,
  password_hash text not null,
  is_admin boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Insertar admin inicial (Alfonso Arceo Obregón)
-- La contraseña la pones tú la primera vez que entres
insert into users (email, name, is_admin) 
values ('alfarceo@gmail.com', 'Alfonso Arceo Obregón', true)
on conflict (email) do nothing;

-- ── PROYECTOS ──
create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references users(id) on delete cascade,
  owner_name text not null,
  owner_email text not null,
  nombre text default '',
  status text default 'nuevo', -- nuevo, evaluacion, tarea, listo, rechazado
  -- Campos del formulario
  f_proyecto text default '',
  f_industria text default '',
  f_etapa text default '',
  f_problema text default '',
  f_solucion text default '',
  f_cliente text default '',
  f_mercado text default '',
  f_demanda text default '',
  f_modelo text default '',
  f_precio text default '',
  f_cac text default '',
  f_competencia text default '',
  f_ventaja text default '',
  f_ia text default '',
  f_sinia text default '',
  f_equipo text default '',
  f_falta text default '',
  f_inversion text default '',
  f_uso text default '',
  f_retorno text default '',
  f_riesgo text default '',
  f_kpis text default '',
  -- Don Juan
  dj_messages jsonb default '[]',
  dj_step integer default 0,
  dj_started boolean default false,
  -- Memo
  memo jsonb default null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── TAREAS ──
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  text text not null,
  done boolean default false,
  created_by text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── ROW LEVEL SECURITY ──
alter table users enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;

-- Usuarios: solo ven su propio perfil (el admin ve todo desde el backend)
create policy "users_own" on users
  for all using (auth.uid()::text = id::text);

-- Proyectos: cada usuario ve los suyos; admins ven todos (manejado en backend)
create policy "projects_owner" on projects
  for all using (owner_email = current_user);

-- Tareas: misma lógica que proyectos
create policy "tasks_project" on tasks
  for all using (
    project_id in (
      select id from projects where owner_email = current_user
    )
  );

-- ── FUNCIONES ÚTILES ──

-- Actualizar updated_at automáticamente
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_updated_at
  before update on projects
  for each row execute function update_updated_at();

create trigger tasks_updated_at
  before update on tasks
  for each row execute function update_updated_at();

create trigger users_updated_at
  before update on users
  for each row execute function update_updated_at();

-- ── ÍNDICES ──
create index if not exists idx_projects_owner_email on projects(owner_email);
create index if not exists idx_projects_status on projects(status);
create index if not exists idx_tasks_project_id on tasks(project_id);
create index if not exists idx_users_email on users(email);

-- ── MÓDULO CONSEJO DE INVERSIÓN ──
-- Ejecutar este bloque en el SQL Editor de Supabase

-- Columnas nuevas en projects
alter table projects 
  add column if not exists votacion jsonb default '{"abierta":false,"rondaActiva":1,"ronda1":{}}',
  add column if not exists rondas jsonb default '[]',
  add column if not exists deleted_at timestamptz default null;

-- Rol sponsor en users
alter table users
  add column if not exists is_sponsor boolean default false,
  add column if not exists sponsor_email text default null;

-- Insertar consejeros (ejecutar después de que existan sus cuentas)
-- update users set is_sponsor = true where email in (
--   'juanpablo@murguia.com','boris@murguia.com','lobas@murguia.com','alex@murguia.com'
-- );

create index if not exists idx_projects_deleted on projects(deleted_at);
