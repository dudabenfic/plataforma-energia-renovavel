const { jsPDF } = require("jspdf");
const { autoTable } = require("jspdf-autotable");
const simulacoesService = require("./simulacoes.service");
const criteriosRepository = require("../repositories/criterios.repository");

const VERDE = [15, 118, 110];

// Faixas de vulnerabilidade pelo Ci (as mesmas usadas na interface).
function faixa(ci) {
  if (ci >= 2 / 3) return "baixa";
  if (ci >= 1 / 3) return "média";
  return "alta";
}

function formatarData(valor) {
  return valor ? new Date(valor).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "-";
}

// Simulações antigas guardavam só pesos e tipos; os nomes vêm da ordem atual.
async function criteriosDaSimulacao(simulacao) {
  const parametros = simulacao.parametros ?? {};

  if (Array.isArray(parametros.criterios)) return parametros.criterios;

  const atuais = await criteriosRepository.listar();

  return (parametros.pesos ?? []).map((peso, j) => ({
    codigo: atuais[j]?.codigo ?? `C${j + 1}`,
    nome: atuais[j]?.nome ?? `Critério ${j + 1}`,
    tipo: parametros.tipos?.[j] ?? atuais[j]?.tipo,
    peso
  }));
}

function celulaCsv(valor) {
  const texto = valor === null || valor === undefined ? "" : String(valor);

  return /[",;\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

// RF06 — relatório CSV de uma simulação salva.
async function gerarCsv(id) {
  const { simulacao, ranking } = await simulacoesService.buscarDetalhes(id);

  const linhas = [
    [
      "posicao",
      "municipio",
      "uf",
      "coeficiente_ci",
      "distancia_positiva",
      "distancia_negativa",
      "simulacao_id",
      "data_execucao"
    ],
    ...ranking.map((item) => [
      item.posicao,
      item.municipio,
      item.uf,
      item.coeficiente_ci.toFixed(6),
      item.distancia_positiva.toFixed(6),
      item.distancia_negativa.toFixed(6),
      simulacao.id,
      simulacao.data_execucao
    ])
  ];

  return "﻿" + linhas.map((linha) => linha.map(celulaCsv).join(",")).join("\n");
}

// RF06 — relatório PDF de uma simulação salva.
async function gerarPdf(id) {
  const { simulacao, ranking } = await simulacoesService.buscarDetalhes(id);
  const criterios = await criteriosDaSimulacao(simulacao);
  const parametros = simulacao.parametros ?? {};

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setTextColor(...VERDE);
  doc.text("Relatório TOPSIS", 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(60);
  doc.text("Plataforma de Energia Renovável - Vulnerabilidade social energética", 14, 25);

  const informacoes = [
    `Gerado em: ${formatarData(new Date())}`,
    `Simulação: #${simulacao.id} (${formatarData(simulacao.data_execucao)})`,
    `Responsável: ${simulacao.usuario?.nome ?? "não registrado"}`,
    parametros.ano_referencia ? `Ano de referência dos indicadores: ${parametros.ano_referencia}` : null,
    `Municípios analisados: ${ranking.length}`
  ].filter(Boolean);

  doc.setTextColor(30);
  informacoes.forEach((linha, i) => doc.text(linha, 14, 34 + i * 6));

  let y = 34 + informacoes.length * 6 + 6;

  doc.setFontSize(13);
  doc.text("Critérios e pesos", 14, y);

  autoTable(doc, {
    startY: y + 3,
    head: [["Código", "Critério", "Tipo", "Peso"]],
    body: criterios.map((c) => [
      c.codigo ?? "",
      c.nome,
      c.tipo === "beneficio" ? "Benefício" : "Custo",
      `${(Number(c.peso) * 100).toFixed(1)}%`
    ]),
    headStyles: { fillColor: VERDE },
    styles: { fontSize: 9 }
  });

  y = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(13);
  doc.text("Ranking", 14, y);

  autoTable(doc, {
    startY: y + 3,
    head: [["Posição", "Município", "UF", "Ci", "D+", "D-", "Vulnerabilidade"]],
    body: ranking.map((item) => [
      `${item.posicao}º`,
      item.municipio ?? "-",
      item.uf ?? "-",
      item.coeficiente_ci.toFixed(4),
      item.distancia_positiva.toFixed(4),
      item.distancia_negativa.toFixed(4),
      faixa(item.coeficiente_ci)
    ]),
    headStyles: { fillColor: VERDE },
    styles: { fontSize: 9 }
  });

  y = doc.lastAutoTable.finalY + 8;

  if (y > doc.internal.pageSize.getHeight() - 20) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(8);
  doc.setTextColor(90);
  doc.text(
    doc.splitTextToSize(
      "Ci = D- / (D+ + D-). Quanto maior o coeficiente, mais próximo o município está da solução ideal " +
        "positiva, ou seja, menor a vulnerabilidade. Faixas: Ci < 0,33 alta; 0,33 a 0,66 média; acima de 0,66 baixa.",
      180
    ),
    14,
    y
  );

  return Buffer.from(doc.output("arraybuffer"));
}

module.exports = { gerarCsv, gerarPdf };
