-- CASYCO · Filtro de compras · estructura y datos iniciales
-- Pegar completo en Supabase > SQL Editor > New query > Run

create table if not exists public.docs (
  coleccion  text not null,
  id         text not null,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid(),
  primary key (coleccion, id)
);

alter table public.docs enable row level security;

drop policy if exists "docs_leer" on public.docs;
drop policy if exists "docs_insertar" on public.docs;
drop policy if exists "docs_actualizar" on public.docs;
drop policy if exists "docs_borrar" on public.docs;
create policy "docs_leer"       on public.docs for select to authenticated using (true);
create policy "docs_insertar"   on public.docs for insert to authenticated with check (true);
create policy "docs_actualizar" on public.docs for update to authenticated using (true) with check (true);
create policy "docs_borrar"     on public.docs for delete to authenticated using (true);

create or replace function public.docs_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); new.updated_by := auth.uid(); return new; end $$;
drop trigger if exists docs_touch on public.docs;
create trigger docs_touch before update on public.docs for each row execute function public.docs_touch();

do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; end $$;

