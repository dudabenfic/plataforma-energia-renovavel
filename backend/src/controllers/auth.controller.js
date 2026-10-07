const authService = require("../services/auth.service");

async function register(req, res) {
  const usuario = await authService.cadastrarUsuario(req.body ?? {});

  res.status(201).json({ sucesso: true, usuario });
}

async function login(req, res) {
  const resultado = await authService.loginUsuario(req.body ?? {});

  res.json({ sucesso: true, ...resultado });
}

function me(req, res) {
  res.json({ sucesso: true, usuario: req.usuario });
}

module.exports = { register, login, me };
