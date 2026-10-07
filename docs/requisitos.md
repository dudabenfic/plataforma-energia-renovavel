# Requisitos e rastreabilidade

## Requisitos funcionais

| ID | Descrição | Prioridade | Implementação |
|---|---|---|---|
| RF01 | Cadastrar municípios/comunidades com dados socioeconômicos | Alta | `routes/municipios.routes.js`, `services/municipios.service.js`, tela **Municípios** |
| RF02 | Cadastrar indicadores e critérios de vulnerabilidade | Alta | `routes/criterios.routes.js`, `routes/indicadores.routes.js`, `/api/municipios/:id/indicadores`, telas **Critérios** e **Municípios** |
| RF03 | Configurar pesos dos critérios TOPSIS | Alta | Pesos por simulação em `POST /api/topsis/executar`; pesos padrão em `PUT /api/criterios/pesos`; tela **Simulação** |
| RF04 | Executar cálculo TOPSIS e gerar ranking | Alta | `domain/topsis.js`, `services/topsis.service.js` |
| RF05 | Visualizar resultados em dashboard com gráficos | Média | Tela **Dashboard** (cards, gráfico de barras, mapa, radar comparativo) |
| RF06 | Exportar relatórios em PDF/CSV | Média | `GET /api/relatorios/:id/pdf` e `/csv` (`services/relatorios.service.js`); exportação na interface (`frontend/src/utils/relatorios.js`) |
| RF07 | Visualização georreferenciada (mapa) | Média | `frontend/src/components/MapView.jsx` (Leaflet): cores por faixa de vulnerabilidade ou por indicador (C1–C7) |
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
| RNF05 | Cobertura de testes ≥ 80% | 99% de cobertura no backend (`npm run test:coverage`, limite mínimo de 80% no Jest) e testes de sistema com Cypress — ver [testes.md](testes.md) |
| RNF06 | Documentação Swagger/OpenAPI | `/api-docs` (interface) e `/api-docs.json` (especificação) |

## Stakeholders

| Stakeholder | Papel | Interesse | Como o sistema atende |
|---|---|---|---|
| Gestor público | Usuário primário | Identificar comunidades vulneráveis para políticas públicas | Perfil `gestor`: dashboard, mapa, execução de simulações e relatórios PDF/CSV |
| Pesquisador | Usuário especialista | Analisar correlações entre indicadores | Perfil `pesquisador`: cadastro de dados, importação, configuração de pesos, comparação entre municípios |
| Comunidade | Beneficiária | Acesso a energia limpa e acessível | Ranking evidencia os municípios mais vulneráveis para priorização |
| Equipe de desenvolvimento | Produtora | Entregar software funcional e documentado | Arquitetura em camadas, testes automatizados, CI e documentação |
| Professor orientador | Validador | Rigor metodológico e acadêmico | Validação do TOPSIS por planilha e testes; rastreabilidade dos requisitos |

Perfis de acesso: `admin` (administrador), `pesquisador` e `gestor`.
