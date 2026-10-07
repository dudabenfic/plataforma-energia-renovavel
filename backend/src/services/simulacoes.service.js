const simulacoesRepository = require("../repositories/simulacoes.repository");
const municipiosRepository = require("../repositories/municipios.repository");
const usuariosRepository = require("../repositories/usuarios.repository");
const AppError = require("../utils/app-error");

const STATUS = ["concluida", "erro", "processando"];
const LIMITE_PADRAO = 50;
const LIMITE_MAXIMO = 200;

function validarData(valor, nome) {
  if (!valor) return undefined;

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    throw new AppError(`${nome} inválida.`, 400);
  }

  return valor;
}

function inteiroOpcional(valor, padrao, { minimo = 0, maximo = Infinity } = {}) {
  if (valor === undefined || valor === "") return padrao;

  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero < minimo || numero > maximo) {
    throw new AppError("Parâmetros de paginação inválidos.", 400);
  }

  return numero;
}

async function anexarUsuarios(simulacoes) {
  const ids = [
    ...new Set(simulacoes.map((s) => s.usuario_id).filter((id) => id !== null))
  ];

  const usuarios = await usuariosRepository.listarNomesPorIds(ids);
  const porId = new Map(usuarios.map((u) => [u.id, u]));

  // Simulações anteriores à autenticação não possuem usuário (null).
  return simulacoes.map((simulacao) => ({
    ...simulacao,
    usuario: porId.get(simulacao.usuario_id) ?? null
  }));
}

async function listar(filtros, usuarioAtual) {
  const status = filtros.status || undefined;

  if (status && !STATUS.includes(status)) {
    throw new AppError("Status inválido.", 400);
  }

  let usuarioId;

  if (filtros.minhas === "true") {
    usuarioId = usuarioAtual.id;
  } else if (filtros.usuario_id) {
    usuarioId = inteiroOpcional(filtros.usuario_id, undefined, { minimo: 1 });
  }

  // data_fim sem horário inclui o dia inteiro.
  let dataFim = validarData(filtros.data_fim, "Data final");
  if (dataFim && /^\d{4}-\d{2}-\d{2}$/.test(dataFim)) {
    dataFim = `${dataFim}T23:59:59.999`;
  }

  const limite = inteiroOpcional(filtros.limite, LIMITE_PADRAO, {
    minimo: 1,
    maximo: LIMITE_MAXIMO
  });
  const deslocamento = inteiroOpcional(filtros.deslocamento, 0);

  const { simulacoes, total } = await simulacoesRepository.listar({
    usuarioId,
    status,
    dataInicio: validarData(filtros.data_inicio, "Data inicial"),
    dataFim,
    limite,
    deslocamento
  });

  return {
    simulacoes: await anexarUsuarios(simulacoes),
    total,
    limite,
    deslocamento
  };
}

async function buscarDetalhes(id) {
  const simulacao = await simulacoesRepository.buscarPorId(id);

  if (!simulacao) {
    throw new AppError("Simulação não encontrada.", 404);
  }

  const resultados = await simulacoesRepository.listarResultados(id);
  const municipios = await municipiosRepository.listarPorIds([
    ...new Set(resultados.map((r) => r.municipio_id))
  ]);
  const porId = new Map(municipios.map((m) => [m.id, m]));

  const ranking = resultados.map((resultado) => {
    const municipio = porId.get(resultado.municipio_id);

    return {
      ...resultado,
      coeficiente_ci: Number(resultado.coeficiente_ci),
      distancia_positiva: Number(resultado.distancia_positiva),
      distancia_negativa: Number(resultado.distancia_negativa),
      municipio: municipio?.nome ?? null,
      uf: municipio?.uf ?? null,
      latitude: municipio?.latitude ?? null,
      longitude: municipio?.longitude ?? null
    };
  });

  const [comUsuario] = await anexarUsuarios([simulacao]);

  return { simulacao: comUsuario, ranking };
}

function celulaCsv(valor) {
  const texto = valor === null || valor === undefined ? "" : String(valor);

  return /[",;\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

// Relatório CSV (RF06) gerado no servidor a partir de uma simulação salva.
async function gerarCsv(id) {
  const { simulacao, ranking } = await buscarDetalhes(id);

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

module.exports = { listar, buscarDetalhes, gerarCsv };
