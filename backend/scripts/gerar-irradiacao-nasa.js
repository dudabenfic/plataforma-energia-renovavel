/*
 * C5 — Irradiação solar global horizontal média anual (kWh/m²/dia) das capitais.
 *
 * Fonte substituta: NASA POWER (climatologia 2001–2020, parâmetro ALLSKY_SFC_SW_DWN),
 * consultada pelas coordenadas de cada capital em docs/dados/capitais.csv.
 * A fonte prevista no projeto é o Atlas Brasileiro de Energia Solar (INPE/LABREN);
 * quando disponível, basta gerar o arquivo de irradiação com os dados do INPE
 * (mesmo formato) e importar novamente.
 *
 * Gera:
 *   docs/dados/irradiacao-capitais.csv  -> codigo_ibge,irradiacao (entrada do gerar-dados-capitais.js)
 *   docs/dados/capitais-c5.csv          -> nome,uf,ano,C5 (para importar na plataforma)
 *
 * Uso: node scripts/gerar-irradiacao-nasa.js
 */
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const PASTA = path.join(__dirname, "../../docs/dados");
const API = "https://power.larc.nasa.gov/api/temporal/climatology/point";

async function irradiacaoAnual(latitude, longitude) {
  const url =
    `${API}?parameters=ALLSKY_SFC_SW_DWN&community=RE&format=JSON` +
    `&latitude=${latitude}&longitude=${longitude}`;
  const resposta = await fetch(url);

  if (!resposta.ok) throw new Error(`NASA POWER: HTTP ${resposta.status}`);

  const dados = await resposta.json();
  const valor = dados.properties.parameter.ALLSKY_SFC_SW_DWN.ANN;

  if (valor === undefined || valor < 0) throw new Error("Valor indisponível.");

  return Number(valor.toFixed(2));
}

async function main() {
  const capitais = parse(fs.readFileSync(path.join(PASTA, "capitais.csv")), {
    columns: true,
    skip_empty_lines: true
  });
  const municipios = await (
    await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/municipios?view=nivelado")
  ).json();
  const codigoPorNome = new Map(
    municipios.map((m) => [`${m["municipio-nome"]}|${m["UF-sigla"]}`, m["municipio-id"]])
  );

  const irradiacao = ["codigo_ibge,irradiacao"];
  const importacao = ["nome,uf,ano,C5"];

  for (const capital of capitais) {
    const valor = await irradiacaoAnual(capital.latitude, capital.longitude);
    const codigo = codigoPorNome.get(`${capital.nome}|${capital.uf}`);

    irradiacao.push(`${codigo},${valor}`);
    importacao.push(`"${capital.nome}",${capital.uf},${capital.ano},${valor}`);
    console.log(`${capital.nome} - ${capital.uf}: ${valor} kWh/m²/dia`);
  }

  fs.writeFileSync(path.join(PASTA, "irradiacao-capitais.csv"), irradiacao.join("\n") + "\n");
  fs.writeFileSync(path.join(PASTA, "capitais-c5.csv"), importacao.join("\n") + "\n");

  console.log("\nArquivos gerados em docs/dados/: irradiacao-capitais.csv e capitais-c5.csv");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
