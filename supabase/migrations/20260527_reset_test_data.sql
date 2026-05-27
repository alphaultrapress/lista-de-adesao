-- =====================================================
-- RESET de dados de teste
-- ATENCAO: IRREVERSIVEL. Roda manualmente no SQL Editor do Supabase.
-- Mantem apenas o admin alphaconvites@adm.com.
-- =====================================================

-- 1) Apaga adesões (students). ON DELETE CASCADE de representatives
--    cuidaria disso, mas explicito por seguranca.
delete from public.students;

-- 2) Apaga tabela legacy adesoes se existir
do $$
begin
  if to_regclass('public.adesoes') is not null then
    execute 'delete from public.adesoes';
  end if;
end $$;

-- 3) Apaga representantes (turmas)
delete from public.representatives;

-- 4) Apaga tabela legacy formandos se existir
do $$
begin
  if to_regclass('public.formandos') is not null then
    execute 'delete from public.formandos';
  end if;
end $$;

-- 5) Apaga usuarios do auth.users exceto o admin
--    O ON DELETE CASCADE em representatives.user_id ja teria limpado se
--    nao fosse a ordem acima. Aqui garantimos remover usuarios orfaos.
delete from auth.users
where lower(email) <> lower('alphaconvites@adm.com');

-- 6) Confirma o estado
select
  (select count(*) from public.students) as students,
  (select count(*) from public.representatives) as representatives,
  (select count(*) from auth.users) as auth_users,
  (select count(*) from public.admins) as admins;
