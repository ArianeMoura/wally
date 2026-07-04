-- ==========================================================================
-- Row-Level Security (RLS) — isolamento de dados por usuário/grupo.
-- Segunda camada de defesa (defense-in-depth): mesmo um bug na aplicação não
-- vaza dados entre tenants. A autorização no service layer permanece obrigatória.
--
-- Modelo de papéis:
--   • dono (ex.: `wally`)      → roda migrations e seed; NÃO sujeito à RLS
--     (RLS habilitada sem FORCE ⇒ o dono das tabelas faz bypass).
--   • `wally_app` (runtime)    → o app conecta com este papel; SUJEITO à RLS.
-- O contexto do usuário é definido por requisição via `SET LOCAL app.current_user_id`.
-- ==========================================================================

-- Papel de runtime da aplicação (idempotente). Em produção, rotacione a senha
-- com `ALTER ROLE wally_app PASSWORD '<segredo>'` (nunca versione o segredo real).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'wally_app') THEN
    CREATE ROLE wally_app LOGIN PASSWORD 'wally_app';
  END IF;
END
$$;--> statement-breakpoint

GRANT USAGE ON SCHEMA public TO wally_app;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO wally_app;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO wally_app;--> statement-breakpoint

-- UUID do usuário atual, lido do GUC de sessão (NULL se não definido).
CREATE OR REPLACE FUNCTION current_app_user_id() RETURNS uuid
  LANGUAGE sql STABLE
  AS $$ SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid $$;--> statement-breakpoint

-- Membro ativo do grupo? SECURITY DEFINER (executa como o dono) para BYPASSAR a
-- RLS de `group_members` e evitar recursão infinita entre policy <-> função.
CREATE OR REPLACE FUNCTION is_group_member(gid uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
  AS $$
    SELECT EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = gid
        AND gm.user_id = current_app_user_id()
        AND gm.deleted_at IS NULL
    )
  $$;--> statement-breakpoint

-- ---- Financas pessoais ---------------------------------------------------
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY transactions_owner ON transactions
  FOR ALL USING (user_id = current_app_user_id())
  WITH CHECK (user_id = current_app_user_id());--> statement-breakpoint

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY budgets_owner ON budgets
  FOR ALL USING (user_id = current_app_user_id())
  WITH CHECK (user_id = current_app_user_id());--> statement-breakpoint

-- Categorias: padroes do sistema (user_id NULL) legiveis por todos; proprias, do dono.
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY categories_read ON categories
  FOR SELECT USING (user_id IS NULL OR user_id = current_app_user_id());--> statement-breakpoint
CREATE POLICY categories_insert ON categories
  FOR INSERT WITH CHECK (user_id = current_app_user_id());--> statement-breakpoint
CREATE POLICY categories_update ON categories
  FOR UPDATE USING (user_id = current_app_user_id())
  WITH CHECK (user_id = current_app_user_id());--> statement-breakpoint
CREATE POLICY categories_delete ON categories
  FOR DELETE USING (user_id = current_app_user_id());--> statement-breakpoint

-- ---- Grupos --------------------------------------------------------------
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY groups_read ON groups
  FOR SELECT USING (owner_id = current_app_user_id() OR is_group_member(id));--> statement-breakpoint
CREATE POLICY groups_insert ON groups
  FOR INSERT WITH CHECK (owner_id = current_app_user_id());--> statement-breakpoint
CREATE POLICY groups_update ON groups
  FOR UPDATE USING (owner_id = current_app_user_id())
  WITH CHECK (owner_id = current_app_user_id());--> statement-breakpoint
CREATE POLICY groups_delete ON groups
  FOR DELETE USING (owner_id = current_app_user_id());--> statement-breakpoint

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY group_members_read ON group_members
  FOR SELECT USING (user_id = current_app_user_id() OR is_group_member(group_id));--> statement-breakpoint
-- Somente o dono do grupo insere/edita associacoes.
CREATE POLICY group_members_insert ON group_members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM groups g WHERE g.id = group_id AND g.owner_id = current_app_user_id())
  );--> statement-breakpoint
CREATE POLICY group_members_update ON group_members
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM groups g WHERE g.id = group_id AND g.owner_id = current_app_user_id())
  );--> statement-breakpoint
-- O membro pode remover a si mesmo; o dono pode remover qualquer um.
CREATE POLICY group_members_delete ON group_members
  FOR DELETE USING (
    user_id = current_app_user_id()
    OR EXISTS (SELECT 1 FROM groups g WHERE g.id = group_id AND g.owner_id = current_app_user_id())
  );--> statement-breakpoint

ALTER TABLE group_expenses ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY group_expenses_all ON group_expenses
  FOR ALL USING (is_group_member(group_id))
  WITH CHECK (is_group_member(group_id));--> statement-breakpoint

-- Cotas: visibilidade herdada do grupo da despesa.
ALTER TABLE expense_shares ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY expense_shares_all ON expense_shares
  FOR ALL USING (
    EXISTS (SELECT 1 FROM group_expenses ge WHERE ge.id = group_expense_id AND is_group_member(ge.group_id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM group_expenses ge WHERE ge.id = group_expense_id AND is_group_member(ge.group_id))
  );--> statement-breakpoint

ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY settlements_all ON settlements
  FOR ALL USING (is_group_member(group_id))
  WITH CHECK (is_group_member(group_id));--> statement-breakpoint

-- ---- Auditoria -----------------------------------------------------------
-- Eventos legiveis pelo ator; escrita ocorre server-side na transacao do ator.
ALTER TABLE financial_events ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY financial_events_actor ON financial_events
  FOR ALL USING (actor_id = current_app_user_id())
  WITH CHECK (actor_id = current_app_user_id());
