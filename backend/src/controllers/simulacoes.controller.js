const simulacoesService = require("../services/simulacoes.service");
const { idValido } = require("../utils/validacao");

async function listar(req, res) {
  const resultado = await simulacoesService.listar(req.query, req.usuario);

  res.json({ sucesso: true, ...resultado });
}

async function buscar(req, res) {
  const resultado = await simulacoesService.buscarDetalhes(
    idValido(req.params.id, "ID de simulação")
  );

  res.json({ sucesso: true, ...resultado });
}

async function relatorioCsv(req, res) {
  const id = idValido(req.params.id, "ID de simulação");
  const csv = await simulacoesService.gerarCsv(id);

  res
    .type("text/csv; charset=utf-8")
    .attachment(`relatorio-simulacao-${id}.csv`)
    .send(csv);
}

module.exports = { listar, buscar, relatorioCsv };
