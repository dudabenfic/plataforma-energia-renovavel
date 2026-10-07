const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const usuariosRepository = require("../repositories/usuarios.repository");
const AppError = require("../utils/app-error");

const PERFIS = ["admin", "pesquisador", "gestor"];
const PERFIL_PADRAO = "pesquisador";
const SALT_ROUNDS = 10;
const TAMANHO_MINIMO_SENHA = 6;
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function obterSegredo() {
  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET não configurado no ambiente.");
  }

  return env.JWT_SECRET;
}

function normalizarEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function validarCadastro({ nome, email, senha }) {
  if (
    typeof nome !== "string" ||
    typeof email !== "string" ||
    typeof senha !== "string" ||
    !nome.trim() ||
    !email.trim() ||
    !senha
  ) {
    throw new AppError("Nome, e-mail e senha são obrigatórios.", 400);
  }

  if (!REGEX_EMAIL.test(normalizarEmail(email))) {
    throw new AppError("E-mail inválido.", 400);
  }

  if (senha.length < TAMANHO_MINIMO_SENHA) {
    throw new AppError(
      `A senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`,
      400
    );
  }
}

async function cadastrarUsuario({ nome, email, senha }) {
  validarCadastro({ nome, email, senha });

  const emailNormalizado = normalizarEmail(email);

  if (await usuariosRepository.existeEmail(emailNormalizado)) {
    throw new AppError("E-mail já cadastrado.", 409);
  }

  const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

  // O perfil nunca vem do cliente: novos usuários são sempre pesquisadores.
  return usuariosRepository.criar({
    nome: nome.trim(),
    email: emailNormalizado,
    senha_hash: senhaHash,
    perfil: PERFIL_PADRAO,
    ativo: true
  });
}

function gerarToken(usuario) {
  return jwt.sign(
    { sub: String(usuario.id), email: usuario.email, perfil: usuario.perfil },
    obterSegredo(),
    { expiresIn: env.JWT_EXPIRES_IN, algorithm: "HS256" }
  );
}

async function loginUsuario({ email, senha }) {
  if (typeof email !== "string" || typeof senha !== "string" || !email || !senha) {
    throw new AppError("E-mail e senha são obrigatórios.", 400);
  }

  const usuario = await usuariosRepository.buscarPorEmailComSenha(
    normalizarEmail(email)
  );

  // Mesma mensagem para e-mail inexistente e senha errada.
  const senhaValida =
    usuario && (await bcrypt.compare(senha, usuario.senha_hash));

  if (!senhaValida) {
    throw new AppError("E-mail ou senha inválidos.", 401);
  }

  if (!usuario.ativo) {
    throw new AppError("Usuário inativo.", 403);
  }

  return {
    token: gerarToken(usuario),
    expiraEm: env.JWT_EXPIRES_IN,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil
    }
  };
}

// Valida o token e retorna o usuário atual (ativo) a partir do "sub".
async function usuarioDoToken(token) {
  let payload;

  try {
    payload = jwt.verify(token, obterSegredo(), { algorithms: ["HS256"] });
  } catch {
    throw new AppError("Token inválido ou expirado.", 401);
  }

  const id = Number(payload.sub);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Token inválido ou expirado.", 401);
  }

  const usuario = await usuariosRepository.buscarPorId(id);

  if (!usuario) {
    throw new AppError("Usuário não encontrado.", 401);
  }

  if (!usuario.ativo) {
    throw new AppError("Usuário inativo.", 403);
  }

  return usuario;
}

module.exports = {
  PERFIS,
  cadastrarUsuario,
  loginUsuario,
  gerarToken,
  usuarioDoToken
};
