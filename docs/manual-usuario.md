# Manual do usuário

## Contas de demonstração

Site: https://plataforma-energia-renovavel.vercel.app/

| Perfil | E-mail | Senha | O que pode fazer |
|---|---|---|---|
| Administrador | `professor.admin@energia.test` | `fzaQa0AWXWuN` | Tudo: cadastros, exclusões, critérios, importação, simulações, relatórios e gerenciamento de usuários |
| Gestor público | `professor.gestor@energia.test` | `INzl4VR6CmSo` | Consultar dados, executar simulações e gerar relatórios (sem cadastrar ou alterar dados) |

Novas contas criadas pela tela **Criar conta** recebem o perfil **pesquisador**.

> As senhas acima são apenas para demonstração e avaliação. Se o repositório se tornar público, altere-as antes.

## 1. Acesso

1. Acesse a aplicação e clique em **Criar conta**.
2. Informe nome, e-mail e senha (mínimo de 6 caracteres). A conta é criada com o perfil **pesquisador**.
3. Nas próximas vezes, use **Entrar**. A sessão expira após o período configurado (padrão de 8 horas); depois disso, é preciso entrar novamente.

Perfis:

- **Pesquisador:** cadastra municípios e indicadores, configura critérios e pesos, importa dados, executa simulações e gera relatórios.
- **Gestor público:** consulta os dados, executa simulações e gera relatórios.
- **Administrador:** tem todas as permissões e também exclui municípios, cadastra/desativa critérios e altera perfis de usuários (tela **Usuários**).

## 2. Dashboard

Mostra o resultado da simulação mais recente:

- total de municípios, critérios ativos, média do coeficiente Ci e número de simulações;
- município **mais vulnerável** (menor Ci) e **menos vulnerável** (maior Ci);
- gráfico do ranking, com cores por faixa de vulnerabilidade;
- mapa com os municípios (vermelho = alta, laranja = média, verde = baixa). Em **Colorir por**, escolha um indicador (C1 a C7) para ver o desempenho de cada município naquele critério;
- comparação entre até 4 municípios em gráfico de radar e tabela com os valores dos indicadores.

## 3. Simulação (TOPSIS)

1. Ajuste os pesos dos critérios C1 a C7 pelo controle deslizante ou digitando a porcentagem. A soma precisa ser **100%**.
   - **Restaurar pesos salvos** volta aos pesos padrão.
   - **Distribuir igualmente** divide os pesos entre todos os critérios.
   - **Salvar como padrão** grava os pesos atuais como padrão para as próximas simulações.
2. Escolha o **ano de referência** dos indicadores e os municípios que participarão da análise (mínimo de 2).
3. Clique em **Executar TOPSIS**.

O resultado mostra a posição, o coeficiente **Ci**, as distâncias **D+** (à solução ideal) e **D-** (à solução anti-ideal) e a faixa de vulnerabilidade de cada município. Quanto **maior o Ci**, **menor a vulnerabilidade**.

Se algum município não tiver valor em um critério com peso maior que zero, ele fica fora da análise e um aviso indica quais critérios estão faltando.

Toda execução fica registrada no histórico com o usuário que a realizou.

## 4. Relatórios

Na tela de resultado ou no detalhe de uma simulação do histórico:

- **Exportar PDF:** título, data, responsável, ano de referência, critérios com tipo e peso, ranking completo (Ci, D+, D-) e explicação das faixas.
- **Exportar CSV:** posição, município, UF, Ci, distâncias, faixa de vulnerabilidade, população, IDH, número e data da simulação. O arquivo abre corretamente no Excel.

## 5. Municípios

- Lista os municípios com população, IDH e os indicadores C1 a C7 do ano selecionado.
- **Novo município:** use **Buscar no IBGE** (UF → município → **Preencher dados**) para preencher nome, UF, população estimada e coordenadas automaticamente.
- **Novo município** / **Editar:** dados do município (nome, UF, população, IDH, latitude e longitude) e valores dos indicadores para um ano de referência.
- Latitude e longitude são necessárias para o município aparecer no mapa.
- **Excluir** (administrador): remove também os indicadores e os resultados do município em simulações anteriores.

## 6. Critérios

Mostra código, indicador, tipo (benefício ou custo), unidade, fonte, peso padrão e situação.

- Benefício: quanto maior o valor, melhor (ex.: renda per capita).
- Custo: quanto menor o valor, melhor (ex.: tarifa de energia).

Pesquisadores e administradores podem editar nome, tipo, unidade, fonte e descrição. Administradores podem cadastrar novos critérios e desativar/reativar critérios (critérios desativados não entram no cálculo, mas continuam no histórico).

## 7. Importação de dados

1. Clique em **Baixar modelo** para obter um CSV de exemplo.
2. Preencha uma linha por município e ano:
   - obrigatórias: `nome`, `uf`, `ano`;
   - opcionais: `populacao`, `idh`, `latitude`, `longitude`;
   - indicadores: colunas `C1` a `C7` (células vazias são ignoradas).
3. Envie o arquivo e clique em **Importar**.

O arquivo inteiro é validado antes da gravação. Se houver erros, nada é importado e uma tabela mostra a linha, o campo e o problema de cada erro. Municípios já cadastrados (mesmo nome e UF) são atualizados.

Arquivos salvos pelo Excel em português (separador `;` e vírgula decimal) são aceitos.

### Onde obter os dados

| Critério | Fonte |
|---|---|
| C1, C3, C6 | IBGE — Censo Demográfico 2022: https://www.ibge.gov.br/estatisticas/sociais/trabalho/22827-censo-demografico-2022.html |
| C2, C7 | ANEEL — Relação de empreendimentos de geração distribuída: https://dadosabertos.aneel.gov.br/pt_BR/dataset/relacao-de-empreendimentos-de-geracao-distribuida |
| C4 | ANEEL — Tarifas das distribuidoras: https://dadosabertos.aneel.gov.br/pt_BR/dataset/tarifas-distribuidoras-energia-eletrica |
| C5 | INPE — Atlas Brasileiro de Energia Solar: https://www.gov.br/inpe/pt-br/assuntos/assuntos-do-inpe/atlas-brasileiro-de-energia-solar |

Exemplos de preparação:

- **C2 (kW/hab):** some a potência instalada (kW) dos empreendimentos solares fotovoltaicos do município na base da ANEEL e divida pela população.
- **C7:** conte os empreendimentos de geração distribuída de fonte renovável em operação no município.
- **C4:** use a tarifa média (R$/kWh) da distribuidora que atende o município.

## 8. Histórico

- Lista as simulações da mais recente para a mais antiga, com data, usuário, status e pesos.
- Filtros: status, período e **Somente as minhas**.
- **Abrir** mostra os parâmetros, o ranking e os botões de exportação.
- Simulações feitas antes da autenticação aparecem sem usuário.
