export function formatarNumero(valor, casas = 2) {
  if (valor === null || valor === undefined || valor === "") return "—";

  const numero = Number(valor);

  if (!Number.isFinite(numero)) return "—";

  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: casas
  });
}

export function formatarCi(valor) {
  return Number.isFinite(Number(valor)) ? Number(valor).toFixed(4) : "—";
}

export function formatarPercentual(valor, casas = 0) {
  return `${(Number(valor) * 100).toFixed(casas)}%`;
}

export function formatarData(valor) {
  if (!valor) return "—";

  return new Date(valor).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

export function nomeTipo(tipo) {
  return tipo === "beneficio" ? "Benefício" : "Custo";
}

// Faixas de vulnerabilidade pelo coeficiente Ci.
// Ci próximo de 1 = próximo da solução ideal = menos vulnerável.
export const FAIXAS = [
  { chave: "alta", rotulo: "Vulnerabilidade alta", minimo: 0, cor: "#dc2626" },
  { chave: "media", rotulo: "Vulnerabilidade média", minimo: 1 / 3, cor: "#d97706" },
  { chave: "baixa", rotulo: "Vulnerabilidade baixa", minimo: 2 / 3, cor: "#16a34a" }
];

export function faixaVulnerabilidade(ci) {
  return [...FAIXAS].reverse().find((faixa) => Number(ci) >= faixa.minimo) ?? FAIXAS[0];
}

// Unifica o formato do ranking vindo da execução (ci, distanciaPositiva...)
// e do histórico (coeficiente_ci, distancia_positiva...).
export function normalizarRanking(lista = []) {
  return lista.map((item) => ({
    posicao: item.posicao,
    municipio_id: item.municipio_id,
    municipio: item.municipio ?? "—",
    uf: item.uf ?? "—",
    ci: Number(item.ci ?? item.coeficiente_ci),
    distanciaPositiva: Number(item.distanciaPositiva ?? item.distancia_positiva),
    distanciaNegativa: Number(item.distanciaNegativa ?? item.distancia_negativa),
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null
  }));
}

// Critérios usados em uma simulação. Simulações antigas guardavam apenas
// pesos e tipos; nesse caso os nomes são associados pela ordem atual.
export function criteriosDaSimulacao(simulacao, criteriosAtuais = []) {
  const parametros = simulacao?.parametros ?? {};

  if (Array.isArray(parametros.criterios)) return parametros.criterios;

  return (parametros.pesos ?? []).map((peso, j) => ({
    codigo: criteriosAtuais[j]?.codigo ?? `C${j + 1}`,
    nome: criteriosAtuais[j]?.nome ?? `Critério ${j + 1}`,
    tipo: parametros.tipos?.[j] ?? criteriosAtuais[j]?.tipo,
    peso
  }));
}
