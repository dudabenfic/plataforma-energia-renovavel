# Gestão do projeto

## Papéis (Scrum)

| Papel | Responsável |
|---|---|
| Product Owner | Professor orientador (valida prioridades e aceita entregas) |
| Scrum Master e equipe de desenvolvimento | Maria Eduarda Benfica Gonçalves (frontend, backend, dados/TOPSIS) |

## Plano × execução

O documento de referência propõe 8 sprints em 16 semanas. O projeto foi iniciado em **04/10/2026** e as entregas foram concentradas em um ciclo curto; a tabela relaciona cada sprint do plano ao que foi entregue.

| Sprint (plano) | Entrega prevista | Situação | Evidência |
|---|---|---|---|
| 1 | Contextualização, requisitos, stakeholders, repositório | ✅ | [requisitos.md](requisitos.md), repositório Git |
| 2 | UML e modelagem do banco | ✅ | [uml.md](uml.md), `backend/migrations/` |
| 3 | Backend: CRUD de municípios e critérios, migrations | ✅ | `backend/src/routes/municipios.routes.js`, `criterios.routes.js` |
| 4 | Engine TOPSIS e testes unitários | ✅ | `backend/src/domain/topsis.js`, `backend/tests/topsis.test.js` |
| 5 | Frontend: dashboard, formulários, integração com a API | ✅ | `frontend/src/pages/` |
| 6 | Mapa georreferenciado e exportação de relatórios | ✅ | `MapView.jsx`, relatórios PDF/CSV |
| 7 | Testes de integração e sistema, correções | ✅ | [testes.md](testes.md) |
| 8 | Documentação final, deploy, apresentação | ✅ documentação e deploy; ⬜ apresentação | Vercel, Render, [manual-usuario.md](manual-usuario.md) |

## Histórico de entregas (Git)

| Data | Entrega |
|---|---|
| 04/10/2026 | Início do projeto |
| 07/10/2026 | Primeira versão da plataforma (TOPSIS, frontend, API) e configuração para produção |
| 07/10/2026 | Correção dos ícones do mapa |
| 07/10/2026 | API em camadas, autenticação JWT/bcrypt e TOPSIS com 7 critérios |
| 07/10/2026 | Frontend com login, dashboard, simulação, histórico, importação e relatórios |
| 07/10/2026 | Documentação, Docker e integração contínua |
| 07/10/2026 | Dados oficiais das 27 capitais (IBGE, ANEEL) e irradiação solar (NASA POWER) |
| 07/10/2026 | Relatório PDF na API, mapa por indicador, busca no IBGE e testes de sistema (Cypress) |

O histórico completo está em `git log`.

## Riscos e decisões

| Situação | Decisão |
|---|---|
| Site do INPE/LABREN indisponível na coleta de C5 | Uso da NASA POWER como fonte substituta documentada; troca pelo INPE por nova importação ([fontes-de-dados.md](fontes-de-dados.md)) |
| Plano gratuito do Render hiberna a API | Aceito para o projeto acadêmico; registrado em [qualidade.md](qualidade.md) |
| Chave pública do Supabase dava acesso direto às tabelas | Backend passou a usar a chave secreta e a RLS foi ativada sem políticas públicas |
| C1 quase não varia entre capitais | Documentado; recomendação de testar pesos menores para C1 |
