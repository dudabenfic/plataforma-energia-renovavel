# Fontes de dados — capitais brasileiras

O arquivo [`dados/capitais.csv`](dados/capitais.csv) contém dados oficiais das 27 capitais no formato da tela **Importação**. Ele é gerado pelo script `backend/scripts/gerar-dados-capitais.js`, que consulta as fontes abaixo.

## Indicadores

| Campo | Indicador | Fonte | Referência |
|---|---|---|---|
| `populacao` | População residente estimada | IBGE — Estimativas da População, SIDRA tabela 6579 | 2026 |
| `C1` | % de domicílios **sem** energia elétrica (100 − % com energia de rede geral ou fonte alternativa) | IBGE — PNAD Contínua anual, SIDRA tabela 6737 (disponível no nível de capital) | 2025 |
| `C2` | Potência instalada de geração distribuída solar (kW) ÷ população | ANEEL — Relação de empreendimentos de geração distribuída (tipo UFV) | Arquivo de 03/10/2026 |
| `C3` | Rendimento nominal médio mensal domiciliar per capita (R$) | IBGE — Censo Demográfico 2022, SIDRA tabela 10295 | 2022 |
| `C4` | Tarifa residencial B1 convencional vigente (TUSD + TE, R$/kWh, sem impostos e bandeiras) da distribuidora da capital | ANEEL — Tarifas homologadas das distribuidoras | Vigente em 10/2026 |
| `C5` | Irradiação solar global horizontal média (kWh/m²/dia) | INPE/LABREN — Atlas Brasileiro de Energia Solar, 2ª ed. | **Pendente** (site do LABREN fora do ar na coleta) |
| `C6` | % de moradores sem rendimento ou com rendimento domiciliar per capita de até 1/4 de salário mínimo | IBGE — Censo Demográfico 2022, SIDRA tabela 10296 | 2022 |
| `C7` | Nº de empreendimentos de geração distribuída de fonte renovável (solar, eólica, hidráulica, biomassa e biogás) | ANEEL — Relação de empreendimentos de geração distribuída | Arquivo de 03/10/2026 |
| `latitude`, `longitude` | Sede municipal | Base `municipios-brasileiros` (código IBGE) | — |

Links:

- IBGE SIDRA: https://sidra.ibge.gov.br
- IBGE — Censo 2022: https://www.ibge.gov.br/estatisticas/sociais/trabalho/22827-censo-demografico-2022.html
- ANEEL — Geração distribuída: https://dadosabertos.aneel.gov.br/pt_BR/dataset/relacao-de-empreendimentos-de-geracao-distribuida
- ANEEL — Tarifas: https://dadosabertos.aneel.gov.br/pt_BR/dataset/tarifas-distribuidoras-energia-eletrica
- INPE — Atlas Brasileiro de Energia Solar: https://labren.ccst.inpe.br/atlas_2017-en.html
- Coordenadas: https://github.com/kelvins/municipios-brasileiros

## Observações metodológicas

- **C6** é uma aproximação de extrema pobreza. O Censo 2022 publica faixas de rendimento em salários mínimos; a faixa "até 1/4 de salário mínimo per capita" (R$ 303 em 2022) é um corte usual de pobreza extrema em estudos brasileiros, mas é mais alto que a linha do Bolsa Família.
- **C1** varia muito pouco entre capitais (0% a 0,3%), e essas diferenças estão dentro da margem de erro da PNAD Contínua. Como o TOPSIS normaliza cada coluna, um peso alto em C1 faz essas pequenas diferenças pesarem muito no ranking. Recomenda-se testar pesos menores para C1 ao analisar capitais.
- **C4** considera a distribuidora que atende cada capital (tabela no script). Os valores não incluem ICMS, PIS/COFINS nem bandeiras tarifárias.
- **C7** é um número absoluto, como no documento de referência, e por isso tende a ser maior em municípios mais populosos.
- O IDH municipal mais recente (PNUD, 2010) não foi incluído; a coluna `idh` fica vazia.
- Os anos de referência dos indicadores são diferentes; o campo `ano` do CSV (2026) indica o ano da coleta.

## Como incluir C5 (INPE)

1. No Atlas do LABREN, obtenha a irradiação global horizontal média anual de cada capital.
2. Crie um arquivo com o cabeçalho `codigo_ibge,irradiacao` e uma linha por capital (ex.: `2927408,5.42`).
3. Gere o CSV de novo informando o arquivo:

```bash
node scripts/gerar-dados-capitais.js --gd <empreendimento-geracao-distribuida.csv> --irradiacao <irradiacao.csv>
```

Outra opção é importar o CSV atual e depois preencher C5 de cada capital na tela **Municípios → Editar**.

## Como gerar novamente

1. Baixe e extraia o `empreendimento-geracao-distribuida.zip` da ANEEL (~110 MB compactado, ~1,5 GB extraído).
2. Na pasta `backend`:

```bash
node scripts/gerar-dados-capitais.js --gd <caminho>/empreendimento-geracao-distribuida.csv
```

O script lê o arquivo da ANEEL em fluxo e guarda apenas os totais por município; nenhum dado dos titulares dos empreendimentos é armazenado.
