const usuariosService = require("../services/usuarios.service");
const { idValido } = require("../utils/validacao");

async function listar(req, res) {
  const usuarios = await usuariosService.listar();

  res.json({ sucesso: true, usuarios });
}

async function atualizar(req, res) {
  const usuario = await usuariosService.atualizar(
    idValido(req.params.id, "ID do usuário"),
    req.body,
    req.usuario
  );

  res.json({ sucesso: true, usuario });
}

module.exports = { listar, atualizar };
