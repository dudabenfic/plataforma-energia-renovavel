# Qualidade — ISO/IEC 25010

Metas do Cap. 11 do documento de referência e a situação do projeto.

| Característica | Subcaracterística | Métrica | Meta | Resultado | Evidência |
|---|---|---|---|---|---|
| Adequação funcional | Completude | % de requisitos implementados | ≥ 90% | **100%** (10 de 10 RF) | [requisitos.md](requisitos.md) |
| Eficiência de desempenho | Tempo de resposta | Cálculo TOPSIS para 500 alternativas | < 3 s | **0,8 ms** no algoritmo; 289 ms para uma simulação completa em produção (30 municípios, incluindo banco) | `topsis.test.js`, `topsis.api.test.js` |
| Usabilidade | Aprendizado | Tempo para a primeira tarefa | < 5 min | Não medido com usuários. O fluxo principal tem 3 passos (entrar → Simulação → Executar TOPSIS), com pesos padrão já preenchidos | Manual do usuário |
| Confiabilidade | Disponibilidade | Uptime mensal | ≥ 99,5% | **Não garantido**: no plano gratuito do Render a API hiberna após inatividade (primeira resposta pode levar ~50 s). Frontend (Vercel) e banco (Supabase) são serviços gerenciados | — |
| Segurança | Confidencialidade | Dados protegidos por autenticação | 100% | **100%** das rotas de dados exigem JWT; senhas com bcrypt; RLS no banco bloqueia a chave pública | `auth.test.js`, migration 002 |
| Manutenibilidade | Modularidade | Acoplamento entre módulos | Baixo | Camadas separadas (rotas → controllers → services → domínio/repositórios); TOPSIS sem dependência de banco ou HTTP; 99% de cobertura | [README](../README.md#arquitetura) |
| Portabilidade | Adaptabilidade | Funciona em 3+ navegadores | Chrome, Firefox, Safari | **Atendido:** Chrome, Firefox, Safari, Brave e Electron (Cypress) verificados | [testes.md](testes.md) |

## Demais características

- **Compatibilidade:** API REST/JSON documentada em OpenAPI (`/api-docs`, `/api-docs.json`).
- **Usabilidade — acessibilidade:** rótulos em todos os campos, navegação por teclado, foco visível, mensagens de erro em português e layout responsivo (desktop, tablet e celular).
- **Confiabilidade — tolerância a falhas:** erros do banco viram respostas padronizadas sem detalhes internos; uma simulação que falha ao gravar o ranking fica com status `erro`; a importação valida o arquivo inteiro antes de gravar.
- **Segurança — integridade e responsabilização:** perfis de acesso (admin, pesquisador, gestor); cada simulação registra o usuário que a executou; critérios são desativados em vez de apagados, preservando o histórico.
