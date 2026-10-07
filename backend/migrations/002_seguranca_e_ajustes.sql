-- =========================================================
-- PLATAFORMA DE ENERGIA RENOVÁVEL
-- 002 — SEGURANÇA (RLS) E AJUSTES DE DADOS DOS CRITÉRIOS
-- =========================================================
--
-- PRÉ-REQUISITO OBRIGATÓRIO (antes da PARTE 1):
--   Trocar a variável SUPABASE_KEY do backend (Render e .env local) pela
--   chave SECRETA do projeto (Project Settings > API Keys > "secret",
--   formato sb_secret_..., ou a antiga service_role).
--   A chave secreta ignora RLS; a chave publishable (anon) passa a ser
--   bloqueada. Se a PARTE 1 for executada com o backend ainda usando a
--   chave publishable, a API deixará de funcionar.
--
-- O acesso aos dados é feito exclusivamente pela API (Express), que
-- aplica autenticação JWT e perfis. O frontend não acessa o Supabase.


-- =========================================================
-- PARTE 1 — Habilitar RLS (bloqueia acesso direto com a chave pública)
-- Sem políticas = nenhum acesso para anon/authenticated.
-- =========================================================

ALTER TABLE usuarios           ENABLE ROW LEVEL SECURITY;
ALTER TABLE municipios         ENABLE ROW LEVEL SECURITY;
ALTER TABLE criterios          ENABLE ROW LEVEL SECURITY;
ALTER TABLE matriz_decisao     ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulacoes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_ranking ENABLE ROW LEVEL SECURITY;


-- =========================================================
-- PARTE 2 — Código de critério único (C1..C7)
-- A importação CSV identifica critérios pelo código.
-- Verificar antes se há duplicidades (deve retornar 0 linhas):
--   SELECT codigo, COUNT(*) FROM criterios
--   WHERE codigo IS NOT NULL GROUP BY codigo HAVING COUNT(*) > 1;
-- =========================================================

CREATE UNIQUE INDEX IF NOT EXISTS uq_criterios_codigo
    ON criterios (codigo)
    WHERE codigo IS NOT NULL;


-- =========================================================
-- PARTE 3 — Fonte oficial dos critérios (documento do professor, 7.1)
-- Atualmente C1–C5 estão com fonte NULL.
-- =========================================================

UPDATE criterios SET fonte = 'IBGE'  WHERE codigo IN ('C1', 'C3', 'C6') AND fonte IS NULL;
UPDATE criterios SET fonte = 'ANEEL' WHERE codigo IN ('C2', 'C4', 'C7') AND fonte IS NULL;
-- C5: os dados atuais das capitais vêm da NASA POWER (o INPE estava indisponível).
-- Troque para 'INPE' quando os valores forem substituídos pelos do Atlas.
UPDATE criterios SET fonte = 'NASA POWER' WHERE codigo = 'C5';


-- =========================================================
-- PARTE 4 (OPCIONAL) — Promover um usuário a administrador
-- Necessário para usar as funções exclusivas do perfil admin
-- (excluir municípios, cadastrar/desativar critérios, gerenciar usuários).
-- Substitua o e-mail antes de executar.
-- =========================================================

-- UPDATE usuarios SET perfil = 'admin', updated_at = NOW()
-- WHERE email = 'seu-email@exemplo.com';


-- =========================================================
-- VERIFICAÇÃO
-- =========================================================

SELECT relname AS tabela, relrowsecurity AS rls_ativa
FROM pg_class
WHERE relname IN ('usuarios', 'municipios', 'criterios',
                  'matriz_decisao', 'simulacoes', 'resultados_ranking');

SELECT id, codigo, nome, tipo, peso, fonte FROM criterios ORDER BY id;
