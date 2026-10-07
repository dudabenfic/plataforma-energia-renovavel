# Plataforma de Energia Renovável

Plataforma web para mensurar indicadores multicritério de vulnerabilidade social relacionados ao acesso, uso e impacto da energia renovável nos municípios, utilizando o método **TOPSIS**.

- **Aplicação:** https://plataforma-energia-renovavel.vercel.app/
- **API:** https://plataforma-energia-renovavel.onrender.com/
- **Documentação da API (Swagger):** https://plataforma-energia-renovavel.onrender.com/api-docs

## Funcionalidades

| Requisito | Funcionalidade |
|---|---|
| RF01 | Cadastro, edição, consulta e exclusão de municípios (nome, UF, população, IDH, coordenadas), com busca na base do IBGE |
| RF02 | Critérios C1–C7 (tipo, unidade, fonte) e indicadores da matriz de decisão por ano de referência |
| RF03 | Configuração dos pesos (soma = 100%), com opção de salvar como padrão |
| RF04 | Execução do TOPSIS e geração do ranking (Ci, D+, D-, posição) |
| RF05 | Dashboard com indicadores-chave, gráfico do ranking, mapa e comparação entre municípios |
| RF06 | Relatórios em PDF e CSV (na interface e pela API) |
| RF07 | Mapa (Leaflet) com os municípios coloridos por faixa de vulnerabilidade ou por indicador |
| RF08 | Cadastro/login com JWT e bcrypt; perfis admin, pesquisador e gestor |
| RF09 | Importação de dados de fontes externas (IBGE, ANEEL, INPE) por CSV validado |
| RF10 | Histórico de simulações com filtros, parâmetros, usuário e ranking |

## Critérios

| Código | Indicador | Tipo | Fonte |
|---|---|---|---|
| C1 | % domicílios sem acesso à eletricidade | Custo | IBGE |
| C2 | Capacidade instalada solar (kW/hab) | Benefício | ANEEL |
| C3 | Renda per capita (R$) | Benefício | IBGE |
| C4 | Tarifa média de energia (R$/kWh) | Custo | ANEEL |
| C5 | Índice de irradiação solar (kWh/m²/dia) | Benefício | INPE |
| C6 | % população em extrema pobreza | Custo | IBGE |
| C7 | Nº de projetos de energia renovável ativos | Benefício | ANEEL |

Critérios de **benefício**: maior é melhor. Critérios de **custo**: menor é melhor.

Os pesos atuais são C1 = 20%, C2 = 20%, C3 = 15%, C4 = 25%, C5 = 20%, C6 = 0% e C7 = 0% (os pesos do exemplo do documento de referência). Eles podem ser alterados na tela **Simulação**. Os valores de C6 e C7 dos municípios de demonstração são apenas para teste.

## Método TOPSIS

Implementado em `backend/src/domain/topsis.js`:

1. Matriz de decisão (municípios × critérios ativos);
2. Normalização vetorial: `r_ij = x_ij / sqrt(Σ x_ij²)`;
3. Matriz ponderada: `v_ij = w_j · r_ij`;
4. Solução ideal positiva (A+);
5. Solução ideal negativa (A-);
6. Distâncias euclidianas D+ e D-;
7. Coeficiente de proximidade: `Ci = D- / (D+ + D-)`;
8. Ranking por Ci decrescente (maior Ci = menos vulnerável).

Com os dados do exemplo numérico do documento, o resultado é **B > A > C** (validado por testes automatizados).

Na interface, o Ci é classificado em faixas: abaixo de 0,33 = vulnerabilidade alta; de 0,33 a 0,66 = média; acima de 0,66 = baixa.

Municípios sem valor em algum critério com peso maior que zero ficam fora da simulação, e a resposta informa quais foram ignorados.

## Arquitetura

```text
plataforma-energia-renovavel/
├── backend/                     API REST (Node.js + Express)
│   ├── migrations/              Scripts SQL do banco
│   ├── src/
│   │   ├── config/              Variáveis de ambiente e cliente Supabase
│   │   ├── controllers/         Camada HTTP (requisição/resposta)
│   │   ├── domain/              Algoritmo TOPSIS
│   │   ├── middleware/          Autenticação JWT, perfis e tratamento de erros
│   │   ├── repositories/        Acesso ao banco de dados
│   │   ├── routes/              Endpoints e documentação Swagger
│   │   ├── services/            Regras de negócio
│   │   ├── swagger/             Configuração OpenAPI
│   │   ├── utils/               Validações
│   │   ├── app.js               Configuração do Express
│   │   └── server.js            Inicialização do servidor
│   └── tests/                   Testes unitários e de integração (Jest + Supertest)
├── frontend/                    SPA (React + Vite)
│   ├── public/                  Modelo de CSV de importação
│   └── src/
│       ├── components/          Mapa, gráficos, tabelas, autenticação
│       ├── hooks/               Autenticação e navegação
│       ├── pages/               Telas da aplicação
│       ├── services/            Cliente da API (Axios)
│       └── utils/               Formatação e relatórios (PDF/CSV)
├── docs/                        Requisitos, UML e manual do usuário
├── docker-compose.yml
└── README.md
```

Fluxo de uma requisição: `routes → middleware (JWT/perfil) → controllers → services → domain/repositories → Supabase`.

## Tecnologias

- **Frontend:** React, Vite, Axios, Leaflet/React-Leaflet, Recharts, jsPDF, jsPDF-AutoTable, FileSaver
- **Backend:** Node.js, Express, Supabase JS, bcryptjs, jsonwebtoken, Multer, csv-parse, Swagger (swagger-jsdoc/swagger-ui-express)
- **Banco:** PostgreSQL + PostGIS (Supabase)
- **Testes:** Jest, Supertest, Cypress
- **Deploy:** Vercel (frontend), Render (backend), Docker Compose (local), GitHub Actions (CI)

## Banco de dados

Tabelas: `usuarios`, `municipios`, `criterios`, `matriz_decisao`, `simulacoes`, `resultados_ranking`.

- `backend/migrations/001_schema_inicial.sql` — schema base e critérios C1–C7.
- `backend/migrations/002_seguranca_e_ajustes.sql` — RLS, código único de critério e fontes dos critérios (ver instruções no arquivo antes de executar).

Os scripts devem ser executados manualmente no **SQL Editor** do Supabase.

## Perfis de acesso

| Perfil | Permissões |
|---|---|
| `pesquisador` (padrão no cadastro) | Consulta, cadastra/edita municípios e indicadores, configura critérios e pesos, importa CSV, executa TOPSIS, gera relatórios |
| `gestor` | Consulta, executa TOPSIS e gera relatórios |
| `admin` | Tudo acima, além de excluir municípios, cadastrar/desativar critérios e gerenciar usuários |

Todas as rotas da API, exceto `GET /`, `POST /api/auth/register` e `POST /api/auth/login`, exigem o cabeçalho `Authorization: Bearer <token>`.

## Instalação local

Pré-requisitos: Node.js 20.19+ (recomendado 22) e npm.

### Backend

```bash
cd backend
npm install
cp .env.example .env   # preencha as variáveis
npm run dev
```

API em `http://localhost:3001` e Swagger em `http://localhost:3001/api-docs`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:3001
npm run dev
```

Aplicação em `http://localhost:5173`.

### Docker Compose

Com `backend/.env` configurado:

```bash
docker compose up --build
```

Frontend em `http://localhost:8080` e API em `http://localhost:3001`.

## Variáveis de ambiente

### Backend (`backend/.env` e Render)

| Variável | Descrição |
|---|---|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_KEY` | Chave secreta do Supabase (somente no backend) |
| `JWT_SECRET` | Segredo para assinar os tokens (texto longo e aleatório) |
| `JWT_EXPIRES_IN` | Validade do token (padrão `8h`) |
| `PORT` | Porta da API (o Render define automaticamente) |
| `CORS_ORIGIN` | Origens permitidas, separadas por vírgula (vazio = todas) |

### Frontend (`frontend/.env` e Vercel)

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | URL da API, sem barra no final |

Nunca versione arquivos `.env`.

## Testes

```bash
cd backend
npm test               # executa os testes
npm run test:coverage  # testes + relatório de cobertura (mínimo de 80%)
```

Testes de sistema (Cypress), com a API de testes em memória:

```bash
cd backend && npm run start:e2e
```

```bash
cd frontend && VITE_API_URL=http://127.0.0.1:3101 npm run build && npm run preview
```

```bash
cd frontend && npm run test:e2e
```

Validação manual do cálculo: [docs/testes/validacao-topsis.xlsx](docs/testes/validacao-topsis.xlsx). Detalhes e resultados em [docs/testes.md](docs/testes.md).

Os testes de API usam um banco em memória que reproduz a interface do cliente Supabase, sem acessar o banco real. Eles cobrem o algoritmo TOPSIS (incluindo o exemplo B > A > C e 500 alternativas em menos de 3 s), autenticação (cadastro, login, JWT, token ausente/inválido/expirado), perfis, municípios, critérios, indicadores, histórico, relatórios e importação.

```bash
cd frontend
npm run lint
npm run build
```

## Importação de dados (RF09)

Na tela **Importação** (ou `POST /api/importar-csv`), envie um CSV com:

```csv
nome,uf,ano,populacao,idh,latitude,longitude,C1,C2,C3,C4,C5,C6,C7
Município A,BA,2026,100000,0.7,-12.9711,-38.5014,15,0.8,980,0.75,5.2,18,4
```

- Obrigatórias: `nome`, `uf`, `ano`. Indicadores: colunas com o código do critério.
- Separador `,` ou `;` (com `;`, aceita vírgula decimal do Excel em português).
- O arquivo inteiro é validado antes da gravação; se houver erro, nada é importado e os erros são listados por linha.
- Municípios existentes (mesmo nome e UF) são atualizados.

Um modelo está disponível em `frontend/public/modelo-importacao.csv`. Dados oficiais das 27 capitais (IBGE e ANEEL) estão em `docs/dados/capitais.csv`, gerados por `backend/scripts/gerar-dados-capitais.js` (ver [fontes de dados](docs/fontes-de-dados.md)). As fontes oficiais de cada indicador estão listadas na tela de importação e em [docs/manual-usuario.md](docs/manual-usuario.md).

## Principais endpoints

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/` | Status da API |
| POST | `/api/auth/register` | Cadastro de usuário |
| POST | `/api/auth/login` | Login (retorna JWT) |
| GET | `/api/auth/me` | Usuário autenticado |
| GET/POST | `/api/municipios` | Listar / criar municípios |
| GET/PUT/DELETE | `/api/municipios/:id` | Consultar / atualizar / excluir município |
| GET/PUT | `/api/municipios/:id/indicadores` | Indicadores de um município |
| GET | `/api/indicadores` | Matriz de decisão por ano |
| GET/POST | `/api/criterios` | Listar / criar critérios |
| PUT | `/api/criterios/pesos` | Salvar pesos padrão |
| GET/PUT/DELETE | `/api/criterios/:id` | Consultar / atualizar / desativar critério |
| POST | `/api/topsis/executar` | Executar TOPSIS |
| GET | `/api/simulacoes` | Histórico (filtros por usuário, status e período) |
| GET | `/api/simulacoes/:id` | Detalhes de uma simulação |
| GET | `/api/relatorios/:id/pdf` | Relatório PDF de uma simulação |
| GET | `/api/relatorios/:id/csv` | Relatório CSV de uma simulação |
| POST | `/api/importar-csv` | Importação de dados |
| GET/PATCH | `/api/usuarios` | Gerenciar usuários (admin) |

Detalhes, exemplos e códigos de erro no Swagger (`/api-docs`).

## Documentação

- [Requisitos e rastreabilidade](docs/requisitos.md)
- [Diagramas UML](docs/uml.md)
- [Manual do usuário](docs/manual-usuario.md)
- [Fontes de dados das capitais](docs/fontes-de-dados.md)
- [Testes](docs/testes.md)
- [Qualidade (ISO/IEC 25010)](docs/qualidade.md)
- [Gestão do projeto](docs/gestao-projeto.md)
- [Roteiro da apresentação](docs/apresentacao.md)
