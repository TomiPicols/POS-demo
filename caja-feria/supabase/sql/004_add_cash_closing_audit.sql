-- Auditoría de cierre: quién cerró y totales basados en items requerirán join en código.
alter table public.cash_closures add column if not exists closed_by uuid;
