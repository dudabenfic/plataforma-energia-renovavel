const { parse } = require("csv-parse/sync");
const criteriosRepository = require("../repositories/criterios.repository");
const municipiosRepository = require("../repositories/municipios.repository");
const matrizRepository = require("../repositories/matriz.repository");
const { validarPopulacao, validarIdh, pontoGeografico } = require("./municipios.service");
const AppError = require("../utils/app-error");
const { vazio, paraNumero, validarCoordenadas } = require("../utils/validacao");

const LIMITE_LINHAS = 5000;
const COLUNAS_MUNICIPIO = ["nome", "uf", "ano", "ano_referencia", "populacao", "idh", "latitude", "longitude"];

// Nomes de coluna do modelo antigo, mantidos por compatibilidade.
// O formato recomendado usa diretamente o código do critério (C1...C7).
const ALIASES = {
  acesso_eletricidade: "C1",
  sem_eletricidade: "C1",
  energia_solar: "C2",
  capacidade_solar: "C2",
  renda_per_capita: "C3",
  tarifa: "C4",
  tarifa_media: "C4",
  irradiacao: "C5",
  irradiacao_solar: "C5",
  extrema_pobreza: "C6",
  pobreza: "C6",
  projetos_renovaveis: "C7",
  projetos_ativos: "C7"
};

function normalizarCabecalho(coluna) {
  return String(coluna).trim().toLowerCase();
}

function chaveMunicipio(nome, uf) {
  return `${String(nome).trim().toLocaleLowerCase("pt-BR")}|${uf}`;
}

// O separador é definido pelo cabeçalho: ";" (Excel em português,
// que permite vírgula decimal) ou "," (padrão).
function detectarSeparador(texto) {
  const cabecalho = texto.replace(/^﻿/, "").split(/\r?\n/, 1)[0];
  const pontoEVirgula = (cabecalho.match(/;/g) ?? []).length;
  const virgulas = (cabecalho.match(/,/g) ?? []).length;

  return pontoEVirgula > virgulas ? ";" : ",";
}

function lerCsv(buffer) {
  const texto = buffer.toString("utf-8");

  try {
    return parse(texto, {
      columns: (cabecalho) => cabecalho.map(normalizarCabecalho),
      skip_empty_lines: true,
      bom: true,
      trim: true,
      delimiter: detectarSeparador(texto)
    });
  } catch (error) {
    throw new AppError(`Não foi possível ler o CSV: ${error.message}`, 400);
  }
}

// Associa cada coluna do CSV a um critério pelo código (C1..Cn) ou alias.
function mapearColunas(colunas, criterios) {
  const porCodigo = new Map(
    criterios.filter((c) => c.codigo).map((c) => [c.codigo.toUpperCase(), c])
  );
  const mapa = new Map();
  const desconhecidas = [];

  for (const coluna of colunas) {
    if (COLUNAS_MUNICIPIO.includes(coluna)) continue;

    const codigo = (ALIASES[coluna] ?? coluna).toUpperCase();
    const criterio = porCodigo.get(codigo);

    if (criterio) {
      mapa.set(coluna, criterio);
    } else {
      desconhecidas.push(coluna);
    }
  }

  return { mapa, desconhecidas };
}

function validarLinha(registro, numeroLinha, colunasCriterios, erros) {
  const adicionarErro = (campo, mensagem) =>
    erros.push({ linha: numeroLinha, campo, mensagem });

  const nome = String(registro.nome ?? "").trim();
  const uf = String(registro.uf ?? "").trim().toUpperCase();
  const ano = Number(registro.ano ?? registro.ano_referencia);

  if (!nome) adicionarErro("nome", "Nome é obrigatório.");
  if (!/^[A-Z]{2}$/.test(uf)) adicionarErro("uf", "UF deve ter 2 letras.");
  if (!Number.isInteger(ano) || ano < 1900 || ano > 2100) {
    adicionarErro("ano", "Ano de referência inválido.");
  }

  const municipio = { nome, uf };
  const tentar = (campo, funcao) => {
    try {
      funcao();
    } catch (error) {
      adicionarErro(campo, error.message);
    }
  };

  if (!vazio(registro.populacao)) {
    tentar("populacao", () => (municipio.populacao = validarPopulacao(registro.populacao)));
  }

  if (!vazio(registro.idh)) {
    tentar("idh", () => (municipio.idh = validarIdh(registro.idh)));
  }

  if (!vazio(registro.latitude) || !vazio(registro.longitude)) {
    tentar("latitude/longitude", () => {
      const { lat, lng } = validarCoordenadas(registro.latitude, registro.longitude);
      municipio.latitude = lat;
      municipio.longitude = lng;
      municipio.coordenadas = pontoGeografico(lat, lng);
    });
  }

  const valores = [];

  for (const [coluna, criterio] of colunasCriterios) {
    if (vazio(registro[coluna])) continue;

    const valor = paraNumero(registro[coluna]);

    if (!Number.isFinite(valor)) {
      adicionarErro(coluna, `Valor numérico inválido: "${registro[coluna]}".`);
    } else if (valor < 0) {
      adicionarErro(coluna, "O valor não pode ser negativo.");
    } else {
      valores.push({ criterio_id: criterio.id, valor });
    }
  }

  return { municipio, ano, valores };
}

// Importação de indicadores (RF09) a partir de CSV montado com dados
// de fontes externas (IBGE, ANEEL, INPE). O arquivo é validado por
// completo antes de qualquer gravação.
async function importarCsv(arquivo) {
  if (!arquivo) {
    throw new AppError("Nenhum arquivo CSV foi enviado.", 400);
  }

  const registros = lerCsv(arquivo.buffer);

  if (registros.length === 0) {
    throw new AppError("O CSV está vazio.", 400);
  }

  if (registros.length > LIMITE_LINHAS) {
    throw new AppError(`O CSV deve ter no máximo ${LIMITE_LINHAS} linhas.`, 400);
  }

  const colunas = Object.keys(registros[0]);

  for (const obrigatoria of ["nome", "uf"]) {
    if (!colunas.includes(obrigatoria)) {
      throw new AppError(`Coluna obrigatória ausente: ${obrigatoria}.`, 400);
    }
  }

  if (!colunas.includes("ano") && !colunas.includes("ano_referencia")) {
    throw new AppError("Coluna obrigatória ausente: ano.", 400);
  }

  const criterios = await criteriosRepository.listar();
  const { mapa, desconhecidas } = mapearColunas(colunas, criterios);

  if (mapa.size === 0) {
    throw new AppError(
      "Nenhuma coluna de critério reconhecida. Use os códigos dos critérios (ex.: C1, C2, ..., C7).",
      400
    );
  }

  const erros = [];
  // Linha 1 do arquivo é o cabeçalho.
  const linhas = registros.map((registro, i) =>
    validarLinha(registro, i + 2, mapa, erros)
  );

  if (erros.length > 0) {
    throw new AppError(
      `O CSV possui ${erros.length} erro(s). Nenhum dado foi importado.`,
      422,
      erros
    );
  }

  // Municípios existentes são identificados por nome + UF.
  const existentes = await municipiosRepository.listar();
  const porChave = new Map(existentes.map((m) => [chaveMunicipio(m.nome, m.uf), m]));

  const novos = new Map();
  const atualizacoes = new Map();

  for (const { municipio } of linhas) {
    const chave = chaveMunicipio(municipio.nome, municipio.uf);
    const existente = porChave.get(chave);

    if (existente) {
      const { nome, uf, ...campos } = municipio;
      if (Object.keys(campos).length > 0) {
        atualizacoes.set(existente.id, { ...atualizacoes.get(existente.id), ...campos });
      }
    } else {
      novos.set(chave, { ...novos.get(chave), ...municipio });
    }
  }

  const criados = await municipiosRepository.criarVarios([...novos.values()]);
  criados.forEach((m) => porChave.set(chaveMunicipio(m.nome, m.uf), m));

  const agora = new Date().toISOString();
  for (const [id, dados] of atualizacoes) {
    await municipiosRepository.atualizar(id, { ...dados, updated_at: agora });
  }

  // Remove duplicidades (mesmo município/critério/ano): vale a última linha.
  const valores = new Map();

  for (const { municipio, ano, valores: lista } of linhas) {
    const municipioId = porChave.get(chaveMunicipio(municipio.nome, municipio.uf)).id;

    for (const { criterio_id, valor } of lista) {
      valores.set(`${municipioId}:${criterio_id}:${ano}`, {
        municipio_id: municipioId,
        criterio_id,
        valor,
        ano_referencia: ano
      });
    }
  }

  const indicadoresGravados = await matrizRepository.salvarValores([...valores.values()]);

  const avisos = desconhecidas.map(
    (coluna) => `Coluna "${coluna}" ignorada (não corresponde a nenhum critério).`
  );

  return {
    mensagem: `${registros.length} linha(s) importada(s) com sucesso.`,
    resumo: {
      linhas: registros.length,
      municipiosCriados: criados.length,
      municipiosAtualizados: atualizacoes.size,
      indicadoresGravados,
      criteriosReconhecidos: [...new Set([...mapa.values()].map((c) => c.codigo))]
    },
    avisos
  };
}

module.exports = { importarCsv, mapearColunas, ALIASES };
