const multer = require("multer");
const AppError = require("../utils/app-error");

// Códigos do PostgreSQL mais comuns convertidos em respostas HTTP.
const ERROS_POSTGRES = {
  23505: [409, "Registro duplicado."],
  23503: [409, "Operação viola relacionamento com outros registros."],
  23514: [400, "Valor fora das regras do banco de dados."],
  "22P02": [400, "Valor com formato inválido."]
};

function rotaNaoEncontrada(req, res) {
  res.status(404).json({
    sucesso: false,
    erro: `Rota ${req.method} ${req.path} não encontrada.`
  });
}

// O Express identifica o middleware de erro pelos 4 parâmetros.
function tratarErros(error, req, res, next) {
  if (error instanceof AppError) {
    return res.status(error.status).json({
      sucesso: false,
      erro: error.message,
      ...(error.detalhes ? { erros: error.detalhes } : {})
    });
  }

  if (error instanceof multer.MulterError) {
    const mensagem =
      error.code === "LIMIT_FILE_SIZE"
        ? "Arquivo muito grande."
        : "Erro no envio do arquivo.";

    return res.status(400).json({ sucesso: false, erro: mensagem });
  }

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ sucesso: false, erro: "JSON inválido." });
  }

  console.error(`Erro em ${req.method} ${req.path}:`, error);

  if (ERROS_POSTGRES[error.code]) {
    const [status, mensagem] = ERROS_POSTGRES[error.code];
    return res.status(status).json({ sucesso: false, erro: mensagem });
  }

  // Detalhes internos ficam apenas no log do servidor.
  res.status(500).json({
    sucesso: false,
    erro: "Erro interno do servidor."
  });
}

module.exports = { rotaNaoEncontrada, tratarErros };
