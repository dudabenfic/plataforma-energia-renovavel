const criteriosService = require("../services/criterios.service");
const { idValido } = require("../utils/validacao");

async function listar(req, res) {
  const criterios = await criteriosService.listar({
    somenteAtivos: req.query.ativos === "true"
  });

  res.json({ sucesso: true, criterios });
}

async function buscar(req, res) {
  const criterio = await criteriosService.buscar(
    idValido(req.params.id, "ID do critério")
  );

  res.json({ sucesso: true, criterio });
}

async function criar(req, res) {
  const criterio = await criteriosService.criar(req.body);

  res.status(201).json({ sucesso: true, criterio });
}

async function atualizar(req, res) {
  const criterio = await criteriosService.atualizar(
    idValido(req.params.id, "ID do critério"),
    req.body
  );

  res.json({ sucesso: true, criterio });
}

async function atualizarPesos(req, res) {
  const criterios = await criteriosService.atualizarPesos(req.body?.pesos);

  res.json({ sucesso: true, criterios });
}

async function desativar(req, res) {
  await criteriosService.desativar(idValido(req.params.id, "ID do critério"));

  res.json({ sucesso: true, mensagem: "Critério desativado com sucesso." });
}

module.exports = { listar, buscar, criar, atualizar, atualizarPesos, desativar };
