import axios from "axios";

// APIs públicas do IBGE (aceitam chamadas direto do navegador).
const LOCALIDADES = "https://servicodados.ibge.gov.br/api/v1/localidades";
const SIDRA = "https://apisidra.ibge.gov.br/values";
// Coordenadas das sedes municipais por código IBGE.
const COORDENADAS =
  "https://raw.githubusercontent.com/kelvins/municipios-brasileiros/main/csv/municipios.csv";

export async function listarEstados() {
  const { data } = await axios.get(`${LOCALIDADES}/estados`, { params: { orderBy: "nome" } });
  return data.map((uf) => ({ sigla: uf.sigla, nome: uf.nome }));
}

export async function listarMunicipiosDaUf(uf) {
  const { data } = await axios.get(`${LOCALIDADES}/estados/${uf}/municipios`, {
    params: { orderBy: "nome" }
  });
  return data.map((m) => ({ codigo: m.id, nome: m.nome }));
}

// População estimada mais recente (IBGE, SIDRA tabela 6579).
async function buscarPopulacao(codigo) {
  const { data } = await axios.get(`${SIDRA}/t/6579/n6/${codigo}/v/9324/p/last%201`);
  const valor = Number(data[1]?.V);
  return Number.isFinite(valor) ? valor : null;
}

async function buscarCoordenadas(codigo) {
  const { data } = await axios.get(COORDENADAS, { responseType: "text" });
  const linha = data.split("\n").find((l) => l.startsWith(`${codigo},`));

  if (!linha) return null;

  const [, , latitude, longitude] = linha.split(",");
  return { latitude: Number(latitude), longitude: Number(longitude) };
}

// Dados para preencher o cadastro. Cada fonte é opcional: se uma falhar,
// as demais continuam valendo.
export async function dadosDoMunicipio(codigo) {
  const [populacao, coordenadas] = await Promise.allSettled([
    buscarPopulacao(codigo),
    buscarCoordenadas(codigo)
  ]);

  return {
    populacao: populacao.status === "fulfilled" ? populacao.value : null,
    coordenadas: coordenadas.status === "fulfilled" ? coordenadas.value : null
  };
}
