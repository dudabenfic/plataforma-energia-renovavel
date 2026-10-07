# Roteiro da apresentação

Sugestão para slides + demonstração ao vivo (~15 minutos).

## Slides

1. **Título** — Plataforma de Energia Renovável: vulnerabilidade social energética com TOPSIS. Links da aplicação e do repositório.
2. **Contexto e objetivo** — ODS 7; comunidades vulneráveis e acesso a energia limpa; objetivo geral e específicos.
3. **Requisitos** — tabela RF01–RF10 (todos atendidos) e RNF01–RNF06 com resultados ([requisitos.md](requisitos.md)).
4. **Critérios** — C1 a C7, tipo (benefício/custo) e fonte (IBGE, ANEEL, INPE/NASA POWER).
5. **Método TOPSIS** — as 7 etapas e a fórmula Ci = D- / (D+ + D-); maior Ci = menos vulnerável.
6. **Validação** — exemplo do documento (B > A > C) na planilha × sistema: valores idênticos ([testes/validacao-topsis.xlsx](testes/validacao-topsis.xlsx)).
7. **Arquitetura** — diagrama de componentes e camadas (rotas → controllers → services → domínio/repositórios); deploy Vercel + Render + Supabase ([uml.md](uml.md)).
8. **Modelo de dados** — diagrama de classes / tabelas.
9. **Segurança** — JWT + bcrypt, perfis (admin, pesquisador, gestor), RLS no banco.
10. **Dados reais** — 27 capitais: fontes e anos ([fontes-de-dados.md](fontes-de-dados.md)); observação sobre C1 e sobre C5.
11. **Qualidade e testes** — 139 testes (99% de cobertura), 8 testes de sistema (Cypress), TOPSIS em 0,8 ms para 500 municípios, CI no GitHub Actions ([testes.md](testes.md), [qualidade.md](qualidade.md)).
12. **Limitações e próximos passos** — disponibilidade do plano gratuito; C5 do INPE; IDH municipal; testes em outros navegadores.
13. **Demonstração ao vivo.**

## Demonstração (roteiro)

Abra o site alguns minutos antes: no plano gratuito, a primeira resposta da API pode levar ~50 s.

1. **Login** com a conta de demonstração.
2. **Dashboard** — indicadores, município mais e menos vulnerável, gráfico do ranking, mapa; trocar **Colorir por** para C5 (irradiação) e C3 (renda).
3. **Comparação** — selecionar 3 capitais no radar.
4. **Simulação** — mostrar pesos (soma 100%); executar; mostrar ranking com Ci, D+, D-; reduzir o peso de C1 e executar de novo para mostrar a sensibilidade do método.
5. **Relatórios** — exportar PDF e CSV.
6. **Histórico** — abrir a simulação, mostrar o usuário e os parâmetros.
7. **Municípios** — buscar um município no IBGE e mostrar o preenchimento automático.
8. **Importação** — mostrar o modelo e a validação (um CSV com erro mostra os erros por linha).
9. **Swagger** — `/api-docs`: autorizar com o token e executar `GET /api/simulacoes`.
