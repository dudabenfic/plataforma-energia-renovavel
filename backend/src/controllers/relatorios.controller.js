const relatoriosService = require("../services/relatorios.service");
const { idValido } = require("../utils/validacao");

async function csv(req, res) {
  const id = idValido(req.params.id, "ID de simulação");
  const conteudo = await relatoriosService.gerarCsv(id);

  res
    .type("text/csv; charset=utf-8")
    .attachment(`relatorio-simulacao-${id}.csv`)
    .send(conteudo);
}

async function pdf(req, res) {
  const id = idValido(req.params.id, "ID de simulação");
  const conteudo = await relatoriosService.gerarPdf(id);

  res
    .type("application/pdf")
    .attachment(`relatorio-simulacao-${id}.pdf`)
    .send(conteudo);
}

module.exports = { csv, pdf };
