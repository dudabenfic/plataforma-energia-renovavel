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
| `C5` | Irradiação solar global horizontal média anual (kWh/m²/dia) | **Substituta:** NASA POWER, climatologia 2001–2020 (parâmetro ALLSKY_SFC_SW_DWN), pelas coordenadas da capital. Fonte prevista: INPE/LABREN — Atlas Brasileiro de Energia Solar | 2001–2020 |
| `C6` | % de moradores sem rendimento ou com rendimento domiciliar per capita de até 1/4 de salário mínimo | IBGE — Censo Demográfico 2022, SIDRA tabela 10296 | 2022 |
| `C7` | Nº de empreendimentos de geração distribuída de fonte renovável (solar, eólica, hidráulica, biomassa e biogás) | ANEEL — Relação de empreendimentos de geração distribuída | Arquivo de 03/10/2026 |
| `latitude`, `longitude` | Sede municipal | Base `municipios-brasileiros` (código IBGE) | — |

Links:

- IBGE SIDRA: https://sidra.ibge.gov.br
- IBGE — Censo 2022: https://www.ibge.gov.br/estatisticas/sociais/trabalho/22827-censo-demografico-2022.html
- ANEEL — Geração distribuída: https://dadosabertos.aneel.gov.br/pt_BR/dataset/relacao-de-empreendimentos-de-geracao-distribuida
- ANEEL — Tarifas: https://dadosabertos.aneel.gov.br/pt_BR/dataset/tarifas-distribuidoras-energia-eletrica
- NASA POWER (C5, substituta): https://power.larc.nasa.gov
- INPE — Atlas Brasileiro de Energia Solar: https://labren.ccst.inpe.br/atlas_2017-en.html
- Coordenadas: https://github.com/kelvins/municipios-brasileiros

## Observações metodológicas

- **C6** é uma aproximação de extrema pobreza. O Censo 2022 publica faixas de rendimento em salários mínimos; a faixa "até 1/4 de salário mínimo per capita" (R$ 303 em 2022) é um corte usual de pobreza extrema em estudos brasileiros, mas é mais alto que a linha do Bolsa Família.
- **C1** varia muito pouco entre capitais (0% a 0,3%), e essas diferenças estão dentro da margem de erro da PNAD Contínua. Como o TOPSIS normaliza cada coluna, um peso alto em C1 faz essas pequenas diferenças pesarem muito no ranking. Recomenda-se testar pesos menores para C1 ao analisar capitais.
- **C4** considera a distribuidora que atende cada capital (tabela no script). Os valores não incluem ICMS, PIS/COFINS nem bandeiras tarifárias.
- **C7** é um número absoluto, como no documento de referência, e por isso tende a ser maior em municípios mais populosos.
- O IDH municipal mais recente (PNUD, 2010) não foi incluído; a coluna `idh` fica vazia.
- Os anos de referência dos indicadores são diferentes; o campo `ano` do CSV (2026) indica o ano da coleta.

## C5: NASA POWER e troca pelo INPE

Durante a coleta, o site do LABREN/INPE e o catálogo de dados do INPE estavam fora do ar, e o PDF do Atlas não traz valores por município, apenas mapas e médias regionais. Por isso, C5 foi obtido da NASA POWER, base pública de irradiação derivada de satélite, consultada pelas coordenadas de cada capital:

```bash
node scripts/gerar-irradiacao-nasa.js
```

O script gera `dados/irradiacao-capitais.csv` (código IBGE e valor) e `dados/capitais-c5.csv` (para importar só o C5 na plataforma).

Os valores seguem o padrão do Atlas do INPE: maior irradiação no Nordeste (ex.: Recife 6,05) e menor no Sul (ex.: Florianópolis 4,32).

Para usar os dados do INPE quando o LABREN estiver disponível:

1. Obtenha a irradiação global horizontal média anual de cada capital no Atlas.
2. Monte um arquivo `codigo_ibge,irradiacao` (mesmo formato de `dados/irradiacao-capitais.csv`).
3. Importe um CSV `nome,uf,ano,C5` com esses valores (como `dados/capitais-c5.csv`). A importação substitui o C5 anterior, já que o ano é o mesmo.

## Como gerar novamente

1. Baixe e extraia o `empreendimento-geracao-distribuida.zip` da ANEEL (~110 MB compactado, ~1,5 GB extraído).
2. Na pasta `backend`:

```bash
node scripts/gerar-dados-capitais.js --gd <caminho>/empreendimento-geracao-distribuida.csv
```

O script lê o arquivo da ANEEL em fluxo e guarda apenas os totais por município; nenhum dado dos titulares dos empreendimentos é armazenado.
