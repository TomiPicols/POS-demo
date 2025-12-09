-- Habilita RLS y define políticas básicas basadas en rol (cajero/supervisor) y autenticación.
-- Ajusta app_metadata.role en Supabase para cada usuario: { "role": "supervisor" } o "cajero".

-- 1) Habilitar RLS
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;

-- 2) Columnas de auditoría (idempotentes)
alter table public.sales add column if not exists created_by uuid;
alter table public.sale_items add column if not exists created_by uuid;
alter table public.sales alter column created_by set default auth.uid();
alter table public.sale_items alter column created_by set default auth.uid();

-- 3) Borrar políticas previas (si existen)
drop policy if exists "products_select_authenticated" on public.products;
drop policy if exists "products_modify_supervisor" on public.products;

drop policy if exists "sales_select_authenticated" on public.sales;
drop policy if exists "sales_insert_authenticated" on public.sales;
drop policy if exists "sales_update_owner_or_supervisor" on public.sales;

drop policy if exists "sale_items_select_authenticated" on public.sale_items;
drop policy if exists "sale_items_insert_authenticated" on public.sale_items;
drop policy if exists "sale_items_update_owner_or_supervisor" on public.sale_items;

-- 4) Funciones de rol
-- auth.role() = 'authenticated' asegura que solo usuarios logueados acceden.
-- auth.jwt()->>'role' lee el claim app_metadata.role del token (cajero/supervisor).

-- PRODUCTS
create policy "products_select_authenticated"
on public.products for select
using (auth.role() = 'authenticated');

create policy "products_modify_admin"
on public.products for all
using (auth.jwt()->>'role' in ('admin','supervisor'))
with check (auth.jwt()->>'role' in ('admin','supervisor'));

-- SALES
create policy "sales_select_authenticated"
on public.sales for select
using (auth.role() = 'authenticated');

create policy "sales_insert_authenticated"
on public.sales for insert
with check (auth.role() = 'authenticated');

create policy "sales_update_owner_or_admin"
on public.sales for update
using (
  auth.jwt()->>'role' in ('admin','supervisor')
  or created_by = auth.uid()
  or created_by is null -- filas antiguas sin owner
)
with check (
  auth.jwt()->>'role' in ('admin','supervisor')
  or created_by = auth.uid()
  or created_by is null
);

-- SALE_ITEMS
create policy "sale_items_select_authenticated"
on public.sale_items for select
using (auth.role() = 'authenticated');

create policy "sale_items_insert_authenticated"
on public.sale_items for insert
with check (auth.role() = 'authenticated');

create policy "sale_items_update_owner_or_admin"
on public.sale_items for update
using (
  auth.jwt()->>'role' in ('admin','supervisor')
  or created_by = auth.uid()
  or created_by is null
)
with check (
  auth.jwt()->>'role' in ('admin','supervisor')
  or created_by = auth.uid()
  or created_by is null
);

-- Opcional: evitar borrados salvo supervisor
drop policy if exists "sale_items_delete_supervisor" on public.sale_items;
drop policy if exists "sales_delete_supervisor" on public.sales;

create policy "sales_delete_admin"
on public.sales for delete
using (auth.jwt()->>'role' in ('admin','supervisor'));

create policy "sale_items_delete_admin"
on public.sale_items for delete
using (auth.jwt()->>'role' in ('admin','supervisor'));
