/*
 * Gera o CSV de importação (RF09) com dados oficiais das 27 capitais.
 *
 * Fontes (detalhes em docs/fontes-de-dados.md):
 *   População ........ IBGE - Estimativas da População (SIDRA 6579), último ano
 *   C1 ............... IBGE - PNAD Contínua (SIDRA 6737), % domicílios sem energia elétrica
 *   C2 ............... ANEEL - Geração distribuída solar (kW) / população
 *   C3 ............... IBGE - Censo 2022 (SIDRA 10295), rendimento médio domiciliar per capita
 *   C4 ............... ANEEL - Tarifa residencial B1 vigente (TUSD + TE, sem impostos)
 *   C5 ............... INPE/LABREN - Atlas Brasileiro de Energia Solar (arquivo opcional)
 *   C6 ............... IBGE - Censo 2022 (SIDRA 10296), % moradores sem rendimento
 *                      ou com até 1/4 de salário mínimo per capita
 *   C7 ............... ANEEL - Nº de empreendimentos de geração distribuída renovável
 *   Coordenadas ...... base municipios-brasileiros (sedes municipais, código IBGE)
 *
 * Uso:
 *   node scripts/gerar-dados-capitais.js --gd <empreendimento-geracao-distribuida.csv>
 *        [--irradiacao <arquivo.csv>] [--saida <arquivo.csv>] [--ano <ano>]
 *
 * --gd          CSV extraído do zip "empreendimento-geracao-distribuida" da ANEEL:
 *               https://dadosabertos.aneel.gov.br/dataset/relacao-de-empreendimentos-de-geracao-distribuida
 * --irradiacao  CSV com as colunas codigo_ibge,irradiacao (kWh/m²/dia), montado a
 *               partir do Atlas do INPE/LABREN. Sem ele, a coluna C5 fica vazia.
 */
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse");

const SIDRA = "https://apisidra.ibge.gov.br/values";
const ANEEL_TARIFAS =
  "https://dadosabertos.aneel.gov.br/api/3/action/datastore_search";
const RECURSO_TARIFAS = "fcf2906c-7c32-4b9b-a637-054e7a5234f4";
const COORDENADAS =
  "https://raw.githubusercontent.com/kelvins/municipios-brasileiros/main/csv/municipios.csv";

// Distribuidora que atende cada capital (sigla do agente na base da ANEEL).
const DISTRIBUIDORAS = {
  1100205: "ERO", // Porto Velho - Energisa Rondônia
  1200401: "EAC", // Rio Branco - Energisa Acre
  1302603: "Âmbar Amazonas", // Manaus
  1400100: "ÂMBAR ENERGIA RR", // Boa Vista
  1501402: "EQUATORIAL PA", // Belém
  1600303: "CEA", // Macapá - CEA Equatorial
  1721000: "ETO", // Palmas - Energisa Tocantins
  2111300: "EQUATORIAL MA", // São Luís
  2211001: "EQUATORIAL PI", // Teresina
  2304400: "ENEL CE", // Fortaleza
  2408102: "COSERN", // Natal
  2507507: "EPB", // João Pessoa - Energisa Paraíba
  2611606: "Neoenergia PE", // Recife
  2704302: "EQUATORIAL AL", // Maceió
  2800308: "ESE", // Aracaju - Energisa Sergipe
  2927408: "COELBA", // Salvador - Neoenergia Coelba
  3106200: "CEMIG-D", // Belo Horizonte
  3205309: "EDP ES", // Vitória
  3304557: "LIGHT SESA", // Rio de Janeiro
  3550308: "ELETROPAULO", // São Paulo - Enel SP
  4106902: "COPEL-DIS", // Curitiba
  4205407: "CELESC", // Florianópolis
  4314902: "CEEE-D", // Porto Alegre - CEEE Equatorial
  5002704: "EMS", // Campo Grande - Energisa Mato Grosso do Sul
  5103403: "EMT", // Cuiabá - Energisa Mato Grosso
  5208707: "EQUATORIAL GO", // Goiânia
  5300108: "Neoenergia Brasília" // Brasília
};

// Fontes não renováveis excluídas da contagem de C7.
const FONTES_NAO_RENOVAVEIS = ["Gás Natural", "Óleo Diesel"];

function argumento(nome) {
  const i = process.argv.indexOf(`--${nome}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

function numero(texto) {
  if (texto === undefined || texto === null) return NaN;
  const limpo = String(texto).trim();
  if (!limpo || limpo === "-" || limpo === "...") return NaN;
  // IBGE usa ponto decimal ("1459.81"); ANEEL usa vírgula ("620,08").
  return limpo.includes(",")
    ? Number(limpo.replace(/\./g, "").replace(",", "."))
    : Number(limpo);
}

async function obterJson(url) {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`Falha ao acessar ${url}: HTTP ${resposta.status}`);
  return resposta.json();
}

// Consulta a API do SIDRA e devolve { codigoMunicipio: linha }.
async function sidra(caminho) {
  const [, ...linhas] = await obterJson(`${SIDRA}/${caminho}`);
  return linhas;
}

async function carregarIbge(codigos) {
  const lista = codigos.join(",");

  const energia = await sidra(`t/6737/n6/${lista}/v/5074/p/last%201/c1/6795/c827/46296`);
  const populacao = await sidra(`t/6579/n6/${lista}/v/9324/p/last%201`);
  const renda = await sidra(`t/10295/n6/${lista}/v/13431/p/2022/c2/6794/c86/95251/c58/95253`);
  const classes = await sidra(
    `t/10296/n6/${lista}/v/1013604/p/2022/c2/6794/c86/95251/c386/9681,9692`
  );

  const dados = {};
  const garantir = (codigo) => (dados[codigo] ??= { pobreza: 0 });

  for (const l of energia) {
    garantir(l.D1C).c1 = Number((100 - numero(l.V)).toFixed(2));
    garantir(l.D1C).anoC1 = l.D3N;
  }
  for (const l of populacao) {
    garantir(l.D1C).populacao = numero(l.V);
    garantir(l.D1C).anoPopulacao = l.D3N;
  }
  for (const l of renda) garantir(l.D1C).c3 = numero(l.V);
  for (const l of classes) garantir(l.D1C).pobreza += numero(l.V);

  return dados;
}

async function carregarTarifas() {
  const filtros = {
    DscBaseTarifaria: "Tarifa de Aplicação",
    DscSubGrupo: "B1",
    DscModalidadeTarifaria: "Convencional",
    DscClasse: "Residencial",
    DscSubClasse: "Residencial",
    DscDetalhe: "Não se aplica"
  };
  const hoje = new Date().toISOString().slice(0, 10);
  const tarifas = {};

  for (const agente of new Set(Object.values(DISTRIBUIDORAS))) {
    const url =
      `${ANEEL_TARIFAS}?resource_id=${RECURSO_TARIFAS}` +
      `&filters=${encodeURIComponent(JSON.stringify({ ...filtros, SigAgente: agente }))}` +
      `&sort=${encodeURIComponent("DatInicioVigencia desc")}&limit=20`;

    const { result } = await obterJson(url);
    // Tarifa vigente: início até hoje e fim a partir de hoje (ou a mais recente).
    const vigente =
      result.records.find((r) => r.DatInicioVigencia <= hoje && r.DatFimVigencia >= hoje) ??
      result.records.find((r) => r.DatInicioVigencia <= hoje);

    if (!vigente) {
      console.warn(`Aviso: tarifa não encontrada para ${agente}.`);
      continue;
    }

    // Valores em R$/MWh -> R$/kWh
    tarifas[agente] = {
      valor: Number(((numero(vigente.VlrTUSD) + numero(vigente.VlrTE)) / 1000).toFixed(4)),
      vigencia: `${vigente.DatInicioVigencia} a ${vigente.DatFimVigencia}`
    };
  }

  return tarifas;
}

async function carregarCoordenadas() {
  const resposta = await fetch(COORDENADAS);
  if (!resposta.ok) throw new Error(`Falha ao baixar coordenadas: HTTP ${resposta.status}`);

  const coordenadas = {};
  for (const linha of (await resposta.text()).split("\n").slice(1)) {
    const [codigo, , latitude, longitude] = linha.split(",");
    if (codigo) coordenadas[codigo] = { latitude, longitude };
  }
  return coordenadas;
}

// Lê o CSV da ANEEL (~1,5 GB) em fluxo, somando apenas os municípios pedidos.
// Somente totais são guardados; dados dos titulares são descartados.
function carregarGeracaoDistribuida(arquivo, codigos) {
  const alvo = new Set(codigos);
  const totais = {};

  return new Promise((resolver, rejeitar) => {
    fs.createReadStream(arquivo)
      .pipe(parse({ delimiter: ";", columns: true, relax_quotes: true }))
      .on("data", (linha) => {
        const codigo = linha.CodMunicipioIbge;
        if (!alvo.has(codigo)) return;

        const total = (totais[codigo] ??= { kwSolar: 0, projetos: 0 });
        const tipo = linha.SigTipoGeracao;
        const fonte = linha.DscFonteGeracao;

        if (tipo === "UFV") total.kwSolar += numero(linha.MdaPotenciaInstaladaKW) || 0;
        if (tipo && !FONTES_NAO_RENOVAVEIS.includes(fonte)) total.projetos += 1;
      })
      .on("end", () => resolver(totais))
      .on("error", rejeitar);
  });
}

function carregarIrradiacao(arquivo) {
  if (!arquivo) return {};

  const valores = {};
  for (const linha of fs.readFileSync(arquivo, "utf-8").split(/\r?\n/).slice(1)) {
    const [codigo, valor] = linha.split(/[,;]/);
    if (codigo && valor) valores[codigo.trim()] = numero(valor);
  }
  return valores;
}

function celula(valor) {
  return valor === undefined || Number.isNaN(valor) ? "" : String(valor);
}

async function main() {
  const arquivoGd = argumento("gd");
  const saida = argumento("saida") ?? path.join(__dirname, "../../docs/dados/capitais.csv");
  const ano = argumento("ano") ?? String(new Date().getFullYear());

  if (!arquivoGd) {
    console.error("Informe o CSV da ANEEL: --gd <empreendimento-geracao-distribuida.csv>");
    process.exit(1);
  }

  const codigos = Object.keys(DISTRIBUIDORAS);

  console.log("Consultando IBGE...");
  const ibge = await carregarIbge(codigos);
  const nomes = await obterJson(
    "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?view=nivelado"
  );
  const municipios = new Map(nomes.map((m) => [String(m["municipio-id"]), m]));

  console.log("Consultando tarifas da ANEEL...");
  const tarifas = await carregarTarifas();

  console.log("Baixando coordenadas...");
  const coordenadas = await carregarCoordenadas();

  console.log("Lendo geração distribuída da ANEEL (pode levar alguns minutos)...");
  const gd = await carregarGeracaoDistribuida(arquivoGd, codigos);

  const irradiacao = carregarIrradiacao(argumento("irradiacao"));

  const linhas = [
    "nome,uf,ano,populacao,idh,latitude,longitude,C1,C2,C3,C4,C5,C6,C7"
  ];

  for (const codigo of codigos) {
    const municipio = municipios.get(codigo);
    const dados = ibge[codigo] ?? {};
    const geracao = gd[codigo] ?? { kwSolar: 0, projetos: 0 };
    const coordenada = coordenadas[codigo] ?? {};

    const c2 = dados.populacao
      ? Number((geracao.kwSolar / dados.populacao).toFixed(4))
      : NaN;

    linhas.push(
      [
        `"${municipio["municipio-nome"]}"`,
        municipio["UF-sigla"],
        ano,
        celula(dados.populacao),
        "",
        celula(coordenada.latitude),
        celula(coordenada.longitude),
        celula(dados.c1),
        celula(c2),
        celula(dados.c3),
        celula(tarifas[DISTRIBUIDORAS[codigo]]?.valor),
        celula(irradiacao[codigo]),
        celula(Number(dados.pobreza?.toFixed(2))),
        celula(geracao.projetos)
      ].join(",")
    );
  }

  fs.mkdirSync(path.dirname(saida), { recursive: true });
  fs.writeFileSync(saida, linhas.join("\n") + "\n", "utf-8");

  const exemplo = Object.values(ibge)[0] ?? {};
  console.log(`\nArquivo gerado: ${saida}`);
  console.log(`População: estimativa ${exemplo.anoPopulacao}; C1: PNAD Contínua ${exemplo.anoC1}.`);
  if (!argumento("irradiacao")) {
    console.log("C5 ficou vazio: informe --irradiacao com os dados do INPE/LABREN.");
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
