const matrizRepository = require("../repositories/matriz.repository");
const criteriosRepository = require("../repositories/criterios.repository");
const municipiosService = require("./municipios.service");
const AppError = require("../utils/app-error");
const { vazio, paraNumero } = require("../utils/validacao");

function validarAno(ano) {
  const numero = Number(ano);

  if (!Number.isInteger(numero) || numero < 1900 || numero > 2100) {
    throw new AppError("Ano de referência inválido.", 400);
  }

  return numero;
}

// Usa o ano informado ou, se ausente, o ano mais recente com dados.
async function resolverAno(ano) {
  if (!vazio(ano)) return validarAno(ano);

  const anos = await matrizRepository.listarAnos();

  return anos[0] ?? null;
}

// Matriz de decisão completa (RF02): municípios x critérios ativos.
async function listarMatriz({ ano } = {}) {
  const anos = await matrizRepository.listarAnos();
  const anoReferencia = vazio(ano) ? anos[0] ?? null : validarAno(ano);

  const [criterios, municipios, registros] = await Promise.all([
    criteriosRepository.listar({ somenteAtivos: true }),
    municipiosService.listar(),
    anoReferencia === null
      ? []
      : matrizRepository.listar({ anoReferencia })
  ]);

  const valoresPorMunicipio = new Map();

  for (const registro of registros) {
    if (!valoresPorMunicipio.has(registro.municipio_id)) {
      valoresPorMunicipio.set(registro.municipio_id, {});
    }

    valoresPorMunicipio.get(registro.municipio_id)[registro.criterio_id] =
      Number(registro.valor);
  }

  return {
    anos,
    ano_referencia: anoReferencia,
    criterios,
    municipios: municipios.map((municipio) => ({
      ...municipio,
      valores: valoresPorMunicipio.get(municipio.id) ?? {}
    }))
  };
}

async function listarDoMunicipio(municipioId) {
  await municipiosService.buscar(municipioId);

  return matrizRepository.listar({ municipioId });
}

// Aceita valores identificados por criterio_id ou pelo código (C1, C2...).
async function salvarDoMunicipio(municipioId, corpo) {
  await municipiosService.buscar(municipioId);

  const anoReferencia = validarAno(corpo?.ano_referencia);
  const valores = corpo?.valores;

  if (!Array.isArray(valores) || valores.length === 0) {
    throw new AppError("Informe a lista de valores dos indicadores.", 400);
  }

  const criterios = await criteriosRepository.listar();
  const porId = new Map(criterios.map((c) => [c.id, c]));
  const porCodigo = new Map(
    criterios.filter((c) => c.codigo).map((c) => [c.codigo.toUpperCase(), c])
  );

  const registros = valores.map((item) => {
    const criterio = item?.criterio_id
      ? porId.get(Number(item.criterio_id))
      : porCodigo.get(String(item?.codigo ?? "").toUpperCase());

    if (!criterio) {
      throw new AppError(
        `Critério ${item?.criterio_id ?? item?.codigo} não encontrado.`,
        400
      );
    }

    const valor = paraNumero(item.valor);

    if (!Number.isFinite(valor)) {
      throw new AppError(
        `Valor inválido para o critério ${criterio.codigo ?? criterio.nome}.`,
        400
      );
    }

    return {
      municipio_id: municipioId,
      criterio_id: criterio.id,
      valor,
      ano_referencia: anoReferencia
    };
  });

  await matrizRepository.salvarValores(registros);

  return matrizRepository.listar({ municipioId, anoReferencia });
}

module.exports = {
  resolverAno,
  validarAno,
  listarMatriz,
  listarDoMunicipio,
  salvarDoMunicipio
};
