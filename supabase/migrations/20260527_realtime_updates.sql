-- =====================================================
-- Habilita REPLICA IDENTITY FULL na tabela students.
-- Sem isso, eventos UPDATE no realtime nao trazem o representative_id
-- e os filtros do dashboard nao acionam reload automatico.
-- =====================================================

alter table public.students replica identity full;
