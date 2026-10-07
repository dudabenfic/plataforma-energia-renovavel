const { usuarioDoToken } = require("../services/auth.service");
const AppError = require("../utils/app-error");

// Exige "Authorization: Bearer TOKEN" e carrega o usuário em req.usuario.
async function autenticar(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization) {
    throw new AppError("Token de autenticação não informado.", 401);
  }

  const [esquema, token, ...resto] = authorization.split(" ");

  if (esquema !== "Bearer" || !token || resto.length > 0) {
    throw new AppError("Formato do token inválido.", 401);
  }

  req.usuario = await usuarioDoToken(token);

  next();
}

// Restringe a rota aos perfis informados. Usar depois de autenticar.
function autorizar(...perfis) {
  return (req, res, next) => {
    if (!req.usuario || !perfis.includes(req.usuario.perfil)) {
      throw new AppError(
        "Seu perfil não tem permissão para esta operação.",
        403
      );
    }

    next();
  };
}

module.exports = autenticar;
module.exports.autenticar = autenticar;
module.exports.autorizar = autorizar;
