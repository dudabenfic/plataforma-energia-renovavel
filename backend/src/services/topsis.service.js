const { topsis } = require("../domain/topsis");
const criteriosRepository = require("../repositories/criterios.repository");
const municipiosRepository = require("../repositories/municipios.repository");
const matrizRepository = require("../repositories/matriz.repository");
const simulacoesRepository = require("../repositories/simulacoes.repository");
const indicadoresService = require("./indicadores.service");
const AppError = require("../utils/app-error");

const TOLERANCIA_SOMA = 0.001;

// Aceita:
//  - lista de números na ordem dos critérios ativos (ordenados por id);
//  - lista de objetos { criterio_id, peso };
//  - ausente/vazio: usa os pesos cadastrados no banco.
function resolverPesos(pesosRecebidos, criterios) {
  const pesosBanco = criterios.map((criterio) => Number(criterio.peso));

  if (pesosRecebidos === undefined || pesosRecebidos === null) {
    return pesosBanco;
  }

  if (!Array.isArray(pesosRecebidos)) {
    throw new AppError("Os pesos devem ser enviados em uma lista.", 400);
  }

  if (pesosRecebidos.length === 0) return pesosBanco;

  let pesos;

  if (typeof pesosRecebidos[0] === "object") {
    const informados = new Map(
      pesosRecebidos.map((item) => [Number(item?.criterio_id), item?.peso])
    );

    for (const id of informados.keys()) {
      if (!criterios.some((criterio) => criterio.id === id)) {
        throw new AppError(`Critério ativo ${id} não encontrado.`, 400);
      }
    }

    pesos = criterios.map((criterio, j) =>
      informados.has(criterio.id)
        ? Number(informados.get(criterio.id))
        : pesosBanco[j]
    );
  } else {
    if (pesosRecebidos.length !== criterios.length) {
      throw new AppError(
        `Informe ${criterios.length} pesos (um para cada critério ativo).`,
        400
      );
    }

    pesos = pesosRecebidos.map(Number);
  }

  if (pesos.some((peso) => !Number.isFinite(peso) || peso < 0 || peso > 1)) {
    throw new AppError("Cada peso deve ser um número entre 0 e 1.", 400);
  }

  return pesos;
}

function validarSoma(pesos) {
  const soma = pesos.reduce((total, peso) => total + peso, 0);

  if (Math.abs(soma - 1) > TOLERANCIA_SOMA) {
    throw new AppError("A soma dos pesos deve ser igual a 100%.", 400);
  }
}

function resolverMunicipioIds(municipioIds) {
  if (municipioIds === undefined || municipioIds === null) return null;

  if (
    !Array.isArray(municipioIds) ||
    municipioIds.some((id) => !Number.isInteger(Number(id)) || Number(id) <= 0)
  ) {
    throw new AppError("municipio_ids deve ser uma lista de IDs válidos.", 400);
  }

  return municipioIds.length === 0 ? null : new Set(municipioIds.map(Number));
}

// Monta a matriz de decisão. Municípios sem valor em algum critério com
// peso > 0 são deixados de fora (e informados), para não distorcer o ranking.
// Para critérios com peso 0 a ausência não altera o resultado e vale 0.
function montarMatriz(municipios, criterios, pesos, registros) {
  const valores = new Map();

  for (const registro of registros) {
    valores.set(
      `${registro.municipio_id}:${registro.criterio_id}`,
      Number(registro.valor)
    );
  }

  const incluidos = [];
  const ignorados = [];
  const matriz = [];

  for (const municipio of municipios) {
    const faltantes = [];

    const linha = criterios.map((criterio, j) => {
      const valor = valores.get(`${municipio.id}:${criterio.id}`);

      if (valor === undefined) {
        if (pesos[j] > 0) faltantes.push(criterio.codigo ?? criterio.nome);
        return 0;
      }

      return valor;
    });

    if (faltantes.length > 0) {
      ignorados.push({
        municipio_id: municipio.id,
        municipio: municipio.nome,
        uf: municipio.uf,
        criteriosSemValor: faltantes
      });
    } else {
      incluidos.push(municipio);
      matriz.push(linha);
    }
  }

  return { matriz, incluidos, ignorados };
}

async function executar({ pesos: pesosRecebidos, ano_referencia, municipio_ids }, usuario) {
  const inicio = Date.now();

  const criterios = await criteriosRepository.listar({ somenteAtivos: true });

  if (criterios.length === 0) {
    throw new AppError("Nenhum critério ativo cadastrado.", 400);
  }

  const pesos = resolverPesos(pesosRecebidos, criterios);
  validarSoma(pesos);

  const filtroMunicipios = resolverMunicipioIds(municipio_ids);
  const anoReferencia = await indicadoresService.resolverAno(ano_referencia);

  if (anoReferencia === null) {
    throw new AppError("Não há indicadores cadastrados na matriz de decisão.", 400);
  }

  const [todosMunicipios, registros] = await Promise.all([
    municipiosRepository.listar(),
    matrizRepository.listar({ anoReferencia })
  ]);

  // Ordem estável por id (alternativas da matriz).
  const municipios = todosMunicipios
    .filter((m) => !filtroMunicipios || filtroMunicipios.has(m.id))
    .sort((a, b) => a.id - b.id);

  const { matriz, incluidos, ignorados } = montarMatriz(
    municipios,
    criterios,
    pesos,
    registros
  );

  if (incluidos.length < 2) {
    throw new AppError(
      "São necessários ao menos 2 municípios com indicadores completos para executar o TOPSIS.",
      400,
      ignorados.length > 0 ? ignorados : undefined
    );
  }

  const tipos = criterios.map((criterio) => criterio.tipo);
  const ranking = topsis(matriz, pesos, tipos);
  const tempoCalculoMs = Date.now() - inicio;

  const simulacao = await simulacoesRepository.criar({
    usuario_id: usuario?.id ?? null,
    status: "concluida",
    parametros: {
      pesos,
      tipos,
      criterios: criterios.map((criterio, j) => ({
        id: criterio.id,
        codigo: criterio.codigo,
        nome: criterio.nome,
        tipo: criterio.tipo,
        unidade: criterio.unidade,
        peso: pesos[j]
      })),
      ano_referencia: anoReferencia,
      municipio_ids: incluidos.map((m) => m.id),
      municipios_ignorados: ignorados.map((m) => m.municipio_id)
    }
  });

  try {
    await simulacoesRepository.salvarResultados(
      ranking.map((resultado) => ({
        simulacao_id: simulacao.id,
        municipio_id: incluidos[resultado.indice].id,
        coeficiente_ci: resultado.ci,
        distancia_positiva: resultado.distanciaPositiva,
        distancia_negativa: resultado.distanciaNegativa,
        posicao: resultado.posicao
      }))
    );
  } catch (error) {
    await simulacoesRepository
      .atualizarStatus(simulacao.id, "erro")
      .catch(() => {});
    throw error;
  }

  const rankingCompleto = ranking.map((resultado) => {
    const municipio = incluidos[resultado.indice];

    return {
      ...resultado,
      municipio_id: municipio.id,
      municipio: municipio.nome,
      uf: municipio.uf,
      latitude: municipio.latitude,
      longitude: municipio.longitude
    };
  });

  return {
    simulacao,
    municipios: incluidos,
    municipiosIgnorados: ignorados,
    criterios,
    pesos,
    ano_referencia: anoReferencia,
    ranking: rankingCompleto,
    tempoCalculoMs
  };
}

module.exports = {
  topsis,
  executar,
  resolverPesos,
  montarMatriz
};
