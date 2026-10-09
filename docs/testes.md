# Estratégia e resultados de testes

Estratégia do Cap. 10 do documento de referência, com o que foi implementado em cada nível.

| Nível | Ferramenta | Escopo | Onde |
|---|---|---|---|
| Unitário | Jest | Algoritmo TOPSIS e cada etapa (normalização, ponderação, ideais, distâncias, Ci) | `backend/tests/topsis.test.js` |
| Integração | Jest + Supertest | API completa (rotas, middleware, services, repositories) com banco em memória | `backend/tests/*.test.js` |
| Sistema (E2E) | Cypress | Fluxo no navegador: login → cadastro de município → TOPSIS → ranking → histórico | `frontend/cypress/e2e/` |
| Aceitação | Planilha + checklist | Ranking confere com o cálculo manual | [`testes/validacao-topsis.xlsx`](testes/validacao-topsis.xlsx) |

Todos os níveis automatizados rodam no GitHub Actions a cada push (`.github/workflows/ci.yml`), junto com o lint, o build do frontend e a montagem das imagens Docker.

## Resultados

### Unitários e de integração (backend)

```bash
cd backend && npm run test:coverage
```

- **139 testes**, todos passando.
- Cobertura: **99,2% das linhas**, 98,7% das instruções, 98,5% das funções e 89,6% dos desvios condicionais (meta do RNF05: ≥ 80%; o Jest falha abaixo disso).

Principais casos cobertos:

| Área | Casos |
|---|---|
| TOPSIS | Exemplo do documento (B > A > C); Ci entre 0 e 1; Ci = D-/(D+ + D-); valor calculado à mão (Ci de A ≈ 0,3361); 7 critérios com C6 e C7 com peso 0 e com peso; custo × benefício; alternativas idênticas; coluna zerada; entradas inválidas; 500 alternativas em menos de 3 s |
| Autenticação | Cadastro com bcrypt e perfil pesquisador; e-mail duplicado; validações; login com JWT (sub, expiração); senha errada; usuário inativo; token ausente, malformado, com assinatura inválida, expirado ou de usuário removido |
| Perfis | Gestor não cadastra; pesquisador não exclui; rotas de usuários só para admin |
| Municípios, critérios e indicadores | Cadastro, edição parcial, exclusão, coordenadas (SRID 4326), pesos padrão com soma 100%, desativação de critério, matriz por ano |
| Simulações e relatórios | Registro do usuário; histórico com filtros e paginação; simulações antigas sem usuário; CSV e PDF |
| Importação | Códigos C1–C7, nomes antigos, separador `;` com vírgula decimal, erros por linha sem gravar nada, arquivo grande, permissões |
| Erros | Falha do banco retorna 500 sem detalhes internos; duplicidade retorna 409; JSON malformado retorna 400 |

Os testes usam `tests/helpers/supabaseMock.js`, um banco em memória que reproduz a interface do cliente Supabase (`select`, `eq`, `order`, `range`, `single`, `upsert`...). O código de produção é testado sem alterações e sem acessar o banco real.

### Sistema (Cypress)

```bash
cd backend && npm run start:e2e          # API com banco em memória (porta 3101)
cd frontend && VITE_API_URL=http://127.0.0.1:3101 npm run build && npm run preview
cd frontend && npm run test:e2e
```

- **8 testes**, todos passando:
  - acesso sem login bloqueado; erro com senha incorreta; cadastro de usuário; saída da conta;
  - cadastro de município com os 7 indicadores; execução do TOPSIS com ranking e Ci (B em 1º com Ci 1,0000); bloqueio da execução quando a soma dos pesos não é 100%; simulação no histórico com usuário.
- Proteção: os testes só aceitam a API de testes. Qualquer chamada a outra API (como a de produção) é bloqueada e o teste falha.

Os testes E2E encontraram um erro real no mapa (troca de página durante a animação de zoom), que foi corrigido.

### Aceitação (planilha)

[`testes/validacao-topsis.xlsx`](testes/validacao-topsis.xlsx) refaz o cálculo do exemplo do documento com fórmulas do Excel em cada etapa (normalização, ponderação, A+, A-, D+, D-, Ci e posição) e compara com os valores gravados pelo sistema na simulação #73.

| Município | Ci (planilha) | Ci (sistema) | Posição | Resultado |
|---|---|---|---|---|
| Município B | 1,000000 | 1,000000 | 1º | OK |
| Município A | 0,336058 | 0,336058 | 2º | OK |
| Município C | 0,000000 | 0,000000 | 3º | OK |

### Checklist de aceitação manual

| Item | Resultado |
|---|---|
| Ranking do exemplo do documento: B > A > C | ✅ |
| Cadastro e login pela interface | ✅ |
| Simulação registrada com o usuário logado | ✅ |
| Exportação PDF e CSV | ✅ |
| Mapa com cores por faixa e por indicador | ✅ |
| Importação do CSV das 27 capitais | ✅ |
| Interface em 375 px (celular) sem rolagem horizontal | ✅ |
| Safari | ✅ |
| Firefox | ✅ |
| Brave | ✅ |
