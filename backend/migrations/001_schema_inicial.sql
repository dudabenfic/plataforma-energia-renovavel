-- =========================================================
-- PLATAFORMA DE ENERGIA RENOVÁVEL
-- MIGRAÇÃO BASE DO PROJETO
-- =========================================================

CREATE EXTENSION IF NOT EXISTS postgis;


-- =========================================================
-- USUÁRIOS
-- RF08 / RNF04
-- =========================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    perfil VARCHAR(20) NOT NULL
        CHECK (perfil IN ('admin', 'pesquisador', 'gestor')),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


-- =========================================================
-- MUNICÍPIOS
-- RF01
-- =========================================================

CREATE TABLE IF NOT EXISTS municipios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    uf CHAR(2) NOT NULL,
    populacao INTEGER,
    idh DECIMAL(4,3),
    coordenadas GEOMETRY(Point, 4326),
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


-- =========================================================
-- CRITÉRIOS
-- RF02
-- =========================================================

CREATE TABLE IF NOT EXISTS criterios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(10) NOT NULL
        CHECK (tipo IN ('beneficio', 'custo')),
    peso DECIMAL(5,4) NOT NULL DEFAULT 0.0,
    unidade VARCHAR(50),
    fonte VARCHAR(100),
    codigo VARCHAR(10),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


-- =========================================================
-- MATRIZ DE DECISÃO
-- =========================================================

CREATE TABLE IF NOT EXISTS matriz_decisao (
    id SERIAL PRIMARY KEY,
    municipio_id INTEGER NOT NULL
        REFERENCES municipios(id)
        ON DELETE CASCADE,
    criterio_id INTEGER NOT NULL
        REFERENCES criterios(id)
        ON DELETE CASCADE,
    valor DECIMAL(15,4) NOT NULL,
    ano_referencia INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(
        municipio_id,
        criterio_id,
        ano_referencia
    )
);


-- =========================================================
-- SIMULAÇÕES
-- =========================================================

CREATE TABLE IF NOT EXISTS simulacoes (
    id SERIAL PRIMARY KEY,

    usuario_id INTEGER
        REFERENCES usuarios(id)
        ON DELETE SET NULL,

    data_execucao TIMESTAMP DEFAULT NOW(),

    parametros JSONB,

    status VARCHAR(20) NOT NULL DEFAULT 'concluida'
        CHECK (
            status IN (
                'concluida',
                'erro',
                'processando'
            )
        )
);


-- =========================================================
-- RESULTADOS DO RANKING
-- =========================================================

CREATE TABLE IF NOT EXISTS resultados_ranking (
    id SERIAL PRIMARY KEY,

    simulacao_id INTEGER NOT NULL
        REFERENCES simulacoes(id)
        ON DELETE CASCADE,

    municipio_id INTEGER NOT NULL
        REFERENCES municipios(id)
        ON DELETE CASCADE,

    coeficiente_ci DECIMAL(10,8),

    distancia_positiva DECIMAL(10,8),

    distancia_negativa DECIMAL(10,8),

    posicao INTEGER
);


-- =========================================================
-- COMPATIBILIDADE COM O BANCO QUE JÁ EXISTE
-- =========================================================

ALTER TABLE municipios
    ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,7);

ALTER TABLE municipios
    ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,7);

ALTER TABLE municipios
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

ALTER TABLE criterios
    ADD COLUMN IF NOT EXISTS fonte VARCHAR(100);

ALTER TABLE criterios
    ADD COLUMN IF NOT EXISTS codigo VARCHAR(10);

ALTER TABLE criterios
    ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;

ALTER TABLE criterios
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

ALTER TABLE simulacoes
    ADD COLUMN IF NOT EXISTS usuario_id INTEGER
    REFERENCES usuarios(id)
    ON DELETE SET NULL;


-- =========================================================
-- CRITÉRIOS OFICIAIS DO PROJETO
-- =========================================================

-- Idempotente: não há UNIQUE em criterios.codigo, então
-- "ON CONFLICT DO NOTHING" não impediria duplicidade.
INSERT INTO criterios
    (codigo, nome, descricao, tipo, peso, unidade, fonte)
SELECT v.codigo, v.nome, v.descricao, v.tipo, v.peso, v.unidade, v.fonte
FROM (VALUES
(
    'C1',
    '% domicílios sem acesso à eletricidade',
    'Percentual de domicílios sem acesso à eletricidade.',
    'custo',
    0.20,
    '%',
    'IBGE'
),
(
    'C2',
    'Capacidade instalada solar',
    'Capacidade de geração solar instalada por habitante.',
    'beneficio',
    0.20,
    'kW/hab',
    'ANEEL'
),
(
    'C3',
    'Renda per capita',
    'Renda domiciliar per capita.',
    'beneficio',
    0.15,
    'R$',
    'IBGE'
),
(
    'C4',
    'Tarifa média de energia',
    'Tarifa média de energia elétrica.',
    'custo',
    0.25,
    'R$/kWh',
    'ANEEL'
),
(
    'C5',
    'Índice de irradiação solar',
    'Índice médio de irradiação solar.',
    'beneficio',
    0.20,
    'kWh/m²/dia',
    'INPE'
),
(
    'C6',
    '% população em extrema pobreza',
    'Percentual da população em situação de extrema pobreza.',
    'custo',
    0.00,
    '%',
    'IBGE'
),
(
    'C7',
    'Projetos de energia renovável ativos',
    'Quantidade de projetos de energia renovável ativos.',
    'beneficio',
    0.00,
    'projetos',
    'ANEEL'
)
) AS v(codigo, nome, descricao, tipo, peso, unidade, fonte)
WHERE NOT EXISTS (
    SELECT 1 FROM criterios c WHERE c.codigo = v.codigo
);


-- =========================================================
-- ÍNDICES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_municipios_uf
    ON municipios(uf);

CREATE INDEX IF NOT EXISTS idx_matriz_municipio
    ON matriz_decisao(municipio_id);

CREATE INDEX IF NOT EXISTS idx_matriz_criterio
    ON matriz_decisao(criterio_id);

CREATE INDEX IF NOT EXISTS idx_matriz_ano
    ON matriz_decisao(ano_referencia);

CREATE INDEX IF NOT EXISTS idx_resultados_simulacao
    ON resultados_ranking(simulacao_id);

CREATE INDEX IF NOT EXISTS idx_resultados_municipio
    ON resultados_ranking(municipio_id);

CREATE INDEX IF NOT EXISTS idx_simulacoes_usuario
    ON simulacoes(usuario_id);

CREATE INDEX IF NOT EXISTS idx_usuarios_email
    ON usuarios(email);


-- =========================================================
-- ATUALIZAR COORDENADAS DOS MUNICÍPIOS EXISTENTES
-- =========================================================

UPDATE municipios
SET
    latitude = ST_Y(coordenadas),
    longitude = ST_X(coordenadas)
WHERE coordenadas IS NOT NULL
  AND (
      latitude IS NULL
      OR longitude IS NULL
  );


-- =========================================================
-- VERIFICAÇÃO
-- =========================================================

SELECT
    id,
    codigo,
    nome,
    tipo,
    peso,
    unidade,
    fonte
FROM criterios
ORDER BY id;