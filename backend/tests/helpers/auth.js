const { gerarToken } = require("../../src/services/auth.service");

const USUARIOS = {
  admin: { id: 1, email: "admin@teste.com", perfil: "admin" },
  pesquisador: { id: 2, email: "pesquisa@teste.com", perfil: "pesquisador" },
  gestor: { id: 3, email: "gestor@teste.com", perfil: "gestor" },
  inativo: { id: 4, email: "inativo@teste.com", perfil: "pesquisador" }
};

function bearer(perfil = "pesquisador") {
  return `Bearer ${gerarToken(USUARIOS[perfil])}`;
}

module.exports = { bearer, USUARIOS };
