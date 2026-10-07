// Erro de negócio com status HTTP associado.
class AppError extends Error {
  constructor(mensagem, status = 400, detalhes) {
    super(mensagem);
    this.status = status;
    this.detalhes = detalhes;
  }
}

module.exports = AppError;
