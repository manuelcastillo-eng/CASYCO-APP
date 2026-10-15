-- CASYCO · Filtro de compras · permisos por usuario y catálogos
-- Pegar completo en Supabase > SQL Editor > New query > Run

-- 1) Tabla de permisos por usuario
create table if not exists public.roles (
  email  text primary key,
  nombre text,
  rol    text not null check (rol in ('direccion', 'contabilidad', 'compras')),
  creado timestamptz not null default now()
);
alter table public.roles enable row level security;

-- Permiso del usuario que está conectado.
-- Mientras nadie tenga permiso asignado, el primer usuario creado en Supabase queda como Dirección (para no quedarte fuera).
create or replace function public.mi_rol() returns text
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select r.rol from public.roles r where lower(r.email) = lower(auth.jwt() ->> 'email')),
    (select 'direccion' where (select u.id from auth.users u order by u.created_at limit 1) = auth.uid())
  )
$$;
grant execute on function public.mi_rol() to authenticated;

drop policy if exists "roles_leer" on public.roles;
drop policy if exists "roles_escribir" on public.roles;
create policy "roles_leer" on public.roles for select to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email') or public.mi_rol() = 'direccion');
create policy "roles_escribir" on public.roles for all to authenticated
  using (public.mi_rol() = 'direccion') with check (public.mi_rol() = 'direccion');

-- Dirección: el primer usuario creado (tú) queda registrado con su correo
insert into public.roles (email, nombre, rol)
select lower(u.email), 'Manuel Castillo', 'direccion' from auth.users u order by u.created_at limit 1
on conflict (email) do nothing;

-- 2) Qué puede ver y cambiar cada permiso
--    Dirección y Contabilidad: todo.
--    Compras: ve OCs y catálogos; captura OCs nuevas y registra proveedores, obras y quién solicita.
--             No ve depósitos ni estados de cuenta, y no puede autorizar ni pagar.
drop policy if exists "docs_leer" on public.docs;
drop policy if exists "docs_insertar" on public.docs;
drop policy if exists "docs_actualizar" on public.docs;
drop policy if exists "docs_borrar" on public.docs;

create policy "docs_leer" on public.docs for select to authenticated using (
  public.mi_rol() in ('direccion', 'contabilidad')
  or (public.mi_rol() = 'compras' and coleccion in ('ocs', 'proveedores', 'solicitantes', 'config'))
);
create policy "docs_insertar" on public.docs for insert to authenticated with check (
  public.mi_rol() in ('direccion', 'contabilidad')
  or (public.mi_rol() = 'compras' and coleccion in ('ocs', 'proveedores', 'solicitantes'))
);
create policy "docs_actualizar" on public.docs for update to authenticated
using (
  public.mi_rol() in ('direccion', 'contabilidad')
  or (public.mi_rol() = 'compras' and (coleccion in ('proveedores', 'solicitantes') or (coleccion = 'config' and id = 'obras')))
)
with check (
  public.mi_rol() in ('direccion', 'contabilidad')
  or (public.mi_rol() = 'compras' and (coleccion in ('proveedores', 'solicitantes') or (coleccion = 'config' and id = 'obras')))
);
create policy "docs_borrar" on public.docs for delete to authenticated using (
  public.mi_rol() in ('direccion', 'contabilidad')
);

-- 3) Catálogo inicial de quién solicita (nombres que ya aparecen en las OCs)
insert into public.docs (coleccion, id, data) values
  ('solicitantes', 'FERNANDA', '{"nombre":"FERNANDA","puesto":"COMPRAS"}'::jsonb),
  ('solicitantes', 'JULIETA',  '{"nombre":"JULIETA","puesto":"COMPRAS"}'::jsonb),
  ('solicitantes', 'DULCE',    '{"nombre":"DULCE","puesto":"CONTABILIDAD"}'::jsonb),
  ('solicitantes', 'LMCM',     '{"nombre":"LMCM","puesto":"DIRECCIÓN"}'::jsonb)
on conflict (coleccion, id) do nothing;
