const municipiosService = require("../services/municipios.service");
const indicadoresService = require("../services/indicadores.service");
const { idValido } = require("../utils/validacao");

async function listar(req, res) {
  const municipios = await municipiosService.listar();

  res.json({ sucesso: true, municipios });
}

async function buscar(req, res) {
  const municipio = await municipiosService.buscar(
    idValido(req.params.id, "ID do município")
  );

  res.json({ sucesso: true, municipio });
}

async function criar(req, res) {
  const municipio = await municipiosService.criar(req.body);

  res.status(201).json({ sucesso: true, municipio });
}

async function atualizar(req, res) {
  const municipio = await municipiosService.atualizar(
    idValido(req.params.id, "ID do município"),
    req.body
  );

  res.json({ sucesso: true, municipio });
}

async function remover(req, res) {
  await municipiosService.remover(idValido(req.params.id, "ID do município"));

  res.json({ sucesso: true, mensagem: "Município excluído com sucesso." });
}

async function listarIndicadores(req, res) {
  const indicadores = await indicadoresService.listarDoMunicipio(
    idValido(req.params.id, "ID do município")
  );

  res.json({ sucesso: true, indicadores });
}

async function salvarIndicadores(req, res) {
  const indicadores = await indicadoresService.salvarDoMunicipio(
    idValido(req.params.id, "ID do município"),
    req.body
  );

  res.json({ sucesso: true, indicadores });
}

module.exports = {
  listar,
  buscar,
  criar,
  atualizar,
  remover,
  listarIndicadores,
  salvarIndicadores
};
