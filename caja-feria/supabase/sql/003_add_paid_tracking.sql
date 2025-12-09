-- Campos para registrar cobro de pendientes
alter table public.sales add column if not exists paid_at timestamptz;
alter table public.sales add column if not exists paid_by uuid;
alter table public.sales add column if not exists paid_method text;
