const indicadoresService = require("../services/indicadores.service");

async function listarMatriz(req, res) {
  const matriz = await indicadoresService.listarMatriz({ ano: req.query.ano });

  res.json({ sucesso: true, ...matriz });
}

module.exports = { listarMatriz };
