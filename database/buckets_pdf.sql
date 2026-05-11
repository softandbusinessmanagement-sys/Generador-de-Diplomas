insert into storage.buckets (id, name, public)
values ('diplomas', 'diplomas', false)
on conflict (id) do nothing;

drop policy if exists storage_diplomas_admin_select on storage.objects;
create policy storage_diplomas_admin_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'diplomas'
  and exists (
    select 1 from public.administradores a
    where a.id = auth.uid() and a.activo = true
  )
);

drop policy if exists storage_diplomas_admin_insert on storage.objects;
create policy storage_diplomas_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'diplomas'
  and exists (
    select 1 from public.administradores a
    where a.id = auth.uid() and a.activo = true
  )
);

drop policy if exists storage_diplomas_admin_delete on storage.objects;
create policy storage_diplomas_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'diplomas'
  and exists (
    select 1 from public.administradores a
    where a.id = auth.uid() and a.activo = true
  )
);