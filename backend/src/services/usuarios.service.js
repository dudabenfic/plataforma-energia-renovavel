const usuariosRepository = require("../repositories/usuarios.repository");
const { PERFIS } = require("./auth.service");
const AppError = require("../utils/app-error");

function listar() {
  return usuariosRepository.listar();
}

// Administração de perfis de acesso (RF08). Apenas perfil e status.
async function atualizar(id, corpo, usuarioAtual) {
  const { perfil, ativo } = corpo ?? {};
  const dados = {};

  if (perfil !== undefined) {
    if (!PERFIS.includes(perfil)) {
      throw new AppError(`Perfil deve ser: ${PERFIS.join(", ")}.`, 400);
    }

    dados.perfil = perfil;
  }

  if (ativo !== undefined) {
    if (typeof ativo !== "boolean") {
      throw new AppError("O campo ativo deve ser verdadeiro ou falso.", 400);
    }

    dados.ativo = ativo;
  }

  if (Object.keys(dados).length === 0) {
    throw new AppError("Informe o perfil e/ou o status do usuário.", 400);
  }

  if (id === usuarioAtual.id) {
    throw new AppError(
      "Não é possível alterar o próprio perfil ou status.",
      400
    );
  }

  dados.updated_at = new Date().toISOString();

  const usuario = await usuariosRepository.atualizar(id, dados);

  if (!usuario) throw new AppError("Usuário não encontrado.", 404);

  return usuario;
}

module.exports = { listar, atualizar };
