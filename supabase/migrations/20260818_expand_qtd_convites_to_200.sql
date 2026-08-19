do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.students'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%qtd_convites%'
  loop
    execute format('alter table public.students drop constraint %I', constraint_name);
  end loop;
end $$;

alter table public.students
  add constraint students_qtd_convites_range
  check (qtd_convites >= 0 and qtd_convites <= 200);
