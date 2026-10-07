# Requisitos e rastreabilidade

## Requisitos funcionais

| ID | Descrição | Prioridade | Implementação |
|---|---|---|---|
| RF01 | Cadastrar municípios/comunidades com dados socioeconômicos | Alta | `routes/municipios.routes.js`, `services/municipios.service.js`, tela **Municípios** |
| RF02 | Cadastrar indicadores e critérios de vulnerabilidade | Alta | `routes/criterios.routes.js`, `routes/indicadores.routes.js`, `/api/municipios/:id/indicadores`, telas **Critérios** e **Municípios** |
| RF03 | Configurar pesos dos critérios TOPSIS | Alta | Pesos por simulação em `POST /api/topsis/executar`; pesos padrão em `PUT /api/criterios/pesos`; tela **Simulação** |
| RF04 | Executar cálculo TOPSIS e gerar ranking | Alta | `domain/topsis.js`, `services/topsis.service.js` |
| RF05 | Visualizar resultados em dashboard com gráficos | Média | Tela **Dashboard** (cards, gráfico de barras, mapa, radar comparativo) |
| RF06 | Exportar relatórios em PDF/CSV | Média | `frontend/src/utils/relatorios.js`, `GET /api/relatorios/:id/csv` |
| RF07 | Visualização georreferenciada (mapa) | Média | `frontend/src/components/MapView.jsx` (Leaflet) |
| RF08 | Gerenciar usuários e perfis de acesso | Alta | `services/auth.service.js` (bcrypt + JWT), `middleware/auth.middleware.js`, `routes/usuarios.routes.js`, tela **Usuários** |
| RF09 | Importar dados de fontes externas (IBGE, ANEEL) | Baixa | `services/importacao.service.js`, tela **Importação** |
| RF10 | Histórico de simulações TOPSIS | Baixa | `services/simulacoes.service.js`, tela **Histórico** |

## Requisitos não funcionais

| ID | Descrição | Como é atendido |
|---|---|---|
| RNF01 | TOPSIS < 3 s para 500 alternativas | Matriz montada com `Map` (O(n)); leitura paginada do Supabase (limite de 1000 linhas por consulta); testes `topsis.test.js` e `topsis.api.test.js` verificam 500 alternativas × 7 critérios |
| RNF02 | Interface responsiva | Layout em grid com breakpoints de 1100, 900 e 600 px; menu recolhível; tabelas com rolagem horizontal; tabela de pesos em formato de cartões no celular |
| RNF03 | Disponibilidade ≥ 99,5% | Frontend estático no Vercel; API sem estado (JWT) no Render; banco gerenciado (Supabase). No plano gratuito do Render a API "hiberna" após inatividade |
| RNF04 | JWT com bcrypt | Senhas com `bcryptjs` (custo 10); token HS256 com expiração (`JWT_EXPIRES_IN`), `sub` = id do usuário; senha nunca retornada |
| RNF05 | Cobertura de testes ≥ 80% | `npm run test:coverage` com limite mínimo configurado no Jest |
| RNF06 | Documentação Swagger/OpenAPI | `/api-docs` (interface) e `/api-docs.json` (especificação) |

## Stakeholders e perfis

| Stakeholder | Perfil no sistema |
|---|---|
| Gestor público | `gestor` |
| Pesquisador | `pesquisador` |
| Administrador | `admin` |
