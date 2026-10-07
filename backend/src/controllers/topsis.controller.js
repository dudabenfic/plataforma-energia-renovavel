const topsisService = require("../services/topsis.service");

async function executar(req, res) {
  const resultado = await topsisService.executar(req.body ?? {}, req.usuario);

  res.json({ sucesso: true, ...resultado });
}

module.exports = { executar };
