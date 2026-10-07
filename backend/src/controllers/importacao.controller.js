const importacaoService = require("../services/importacao.service");

async function importarCsv(req, res) {
  const resultado = await importacaoService.importarCsv(req.file);

  res.json({ sucesso: true, ...resultado });
}

module.exports = { importarCsv };
