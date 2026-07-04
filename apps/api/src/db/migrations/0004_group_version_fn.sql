-- Incremento da versão do grupo (concorrência otimista, RNF-008) por QUALQUER
-- membro. A RLS de `groups` só permite UPDATE ao dono, então usamos uma função
-- SECURITY DEFINER que valida a associação internamente e faz o bump com bypass
-- controlado — sem afrouxar a policy geral.
CREATE OR REPLACE FUNCTION bump_group_version(gid uuid) RETURNS integer
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
  AS $$
  DECLARE new_version integer;
  BEGIN
    IF NOT is_group_member(gid) THEN
      RAISE EXCEPTION 'usuário não é membro do grupo %', gid
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    UPDATE groups
      SET version = version + 1, updated_at = now()
      WHERE id = gid
      RETURNING version INTO new_version;
    RETURN new_version;
  END;
  $$;
