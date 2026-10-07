import { saveAs } from "file-saver";
import { faixaVulnerabilidade, formatarData, nomeTipo } from "./formatacao";

function celulaCsv(valor) {
  const texto = valor === null || valor === undefined ? "" : String(valor);

  return /[",;\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

function nomeArquivo(simulacao, extensao) {
  return simulacao?.id
    ? `relatorio-topsis-simulacao-${simulacao.id}.${extensao}`
    : `relatorio-topsis.${extensao}`;
}

// RF06 — relatório CSV do ranking.
export function exportarCsv({ ranking, simulacao, municipios = [] }) {
  const porId = new Map(municipios.map((m) => [m.id, m]));

  const linhas = [
    [
      "posicao",
      "municipio",
      "uf",
      "coeficiente_ci",
      "distancia_positiva",
      "distancia_negativa",
      "faixa_vulnerabilidade",
      "populacao",
      "idh",
      "simulacao_id",
      "data_execucao"
    ],
    ...ranking.map((item) => {
      const municipio = porId.get(item.municipio_id);

      return [
        item.posicao,
        item.municipio,
        item.uf,
        item.ci.toFixed(6),
        item.distanciaPositiva.toFixed(6),
        item.distanciaNegativa.toFixed(6),
        faixaVulnerabilidade(item.ci).rotulo,
        municipio?.populacao ?? "",
        municipio?.idh ?? "",
        simulacao?.id ?? "",
        simulacao?.data_execucao ?? ""
      ];
    })
  ];

  const csv = linhas.map((linha) => linha.map(celulaCsv).join(",")).join("\n");

  // BOM para o Excel reconhecer UTF-8 (acentos).
  saveAs(
    new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }),
    nomeArquivo(simulacao, "csv")
  );
}

// RF06 — relatório PDF. As bibliotecas são carregadas sob demanda
// para não aumentar o carregamento inicial da aplicação.
export async function exportarPdf({ ranking, simulacao, criterios, anoReferencia, usuario }) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable")
  ]);

  const doc = new jsPDF();
  const verde = [15, 118, 110];

  doc.setFontSize(18);
  doc.setTextColor(...verde);
  doc.text("Relatório TOPSIS", 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(60);
  doc.text("Plataforma de Energia Renovável - Vulnerabilidade social energética", 14, 25);

  const informacoes = [
    `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
    simulacao?.id ? `Simulação: #${simulacao.id} (${formatarData(simulacao.data_execucao)})` : null,
    usuario ? `Responsável: ${usuario}` : null,
    anoReferencia ? `Ano de referência dos indicadores: ${anoReferencia}` : null,
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
      nomeTipo(c.tipo),
      `${(Number(c.peso) * 100).toFixed(1)}%`
    ]),
    headStyles: { fillColor: verde },
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
      item.municipio,
      item.uf,
      item.ci.toFixed(4),
      item.distanciaPositiva.toFixed(4),
      item.distanciaNegativa.toFixed(4),
      faixaVulnerabilidade(item.ci).rotulo.replace("Vulnerabilidade ", "")
    ]),
    headStyles: { fillColor: verde },
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

  doc.save(nomeArquivo(simulacao, "pdf"));
}
