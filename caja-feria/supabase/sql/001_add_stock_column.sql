-- Agrega columna de stock para controlar inventario en productos.
alter table public.products
  add column if not exists stock integer default 0;

update public.products
set stock = coalesce(stock, 0)
where stock is null;
