const municipiosRepository = require("../repositories/municipios.repository");
const AppError = require("../utils/app-error");
const {
  vazio,
  paraNumero,
  normalizarUf,
  validarCoordenadas
} = require("../utils/validacao");

function pontoGeografico(lat, lng) {
  // EWKT com SRID para compatibilidade com GEOMETRY(Point, 4326).
  return `SRID=4326;POINT(${lng} ${lat})`;
}

function validarPopulacao(populacao) {
  if (vazio(populacao)) return null;

  const numero = paraNumero(populacao);

  if (!Number.isInteger(numero) || numero < 0) {
    throw new AppError("População inválida.", 400);
  }

  return numero;
}

function validarIdh(idh) {
  if (vazio(idh)) return null;

  const numero = paraNumero(idh);

  if (!Number.isFinite(numero) || numero < 0 || numero > 1) {
    throw new AppError("O IDH deve estar entre 0 e 1.", 400);
  }

  return numero;
}

function aplicarCoordenadas(dados, latitude, longitude) {
  if (vazio(latitude) && vazio(longitude)) {
    dados.latitude = null;
    dados.longitude = null;
    dados.coordenadas = null;
    return;
  }

  if (vazio(latitude) || vazio(longitude)) {
    throw new AppError(
      "Latitude e longitude devem ser informadas juntas.",
      400
    );
  }

  const { lat, lng } = validarCoordenadas(latitude, longitude);

  dados.latitude = lat;
  dados.longitude = lng;
  dados.coordenadas = pontoGeografico(lat, lng);
}

// Monta os dados para gravação. Em atualização (parcial = true),
// apenas os campos enviados são alterados.
function montarDados(corpo, { parcial = false } = {}) {
  const { nome, uf, populacao, idh, latitude, longitude } = corpo ?? {};
  const dados = {};

  if (!parcial || nome !== undefined) {
    if (vazio(nome)) throw new AppError("Nome é obrigatório.", 400);
    dados.nome = String(nome).trim();
  }

  if (!parcial || uf !== undefined) {
    if (vazio(uf)) throw new AppError("UF é obrigatória.", 400);
    dados.uf = normalizarUf(uf);
  }

  if (!parcial || populacao !== undefined) {
    dados.populacao = validarPopulacao(populacao);
  }

  if (!parcial || idh !== undefined) {
    dados.idh = validarIdh(idh);
  }

  if (!parcial || latitude !== undefined || longitude !== undefined) {
    aplicarCoordenadas(dados, latitude, longitude);
  }

  return dados;
}

async function buscar(id) {
  const municipio = await municipiosRepository.buscarPorId(id);

  if (!municipio) {
    throw new AppError("Município não encontrado.", 404);
  }

  return municipio;
}

function listar() {
  return municipiosRepository.listar();
}

function criar(corpo) {
  return municipiosRepository.criar(montarDados(corpo));
}

async function atualizar(id, corpo) {
  const dados = montarDados(corpo, { parcial: true });
  dados.updated_at = new Date().toISOString();

  const municipio = await municipiosRepository.atualizar(id, dados);

  if (!municipio) {
    throw new AppError("Município não encontrado.", 404);
  }

  return municipio;
}

async function remover(id) {
  const removidos = await municipiosRepository.remover(id);

  if (removidos.length === 0) {
    throw new AppError("Município não encontrado.", 404);
  }
}

module.exports = {
  listar,
  buscar,
  criar,
  atualizar,
  remover,
  montarDados,
  validarPopulacao,
  validarIdh,
  pontoGeografico
};
