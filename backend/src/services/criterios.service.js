const criteriosRepository = require("../repositories/criterios.repository");
const AppError = require("../utils/app-error");
const { vazio, paraNumero } = require("../utils/validacao");

const TIPOS = ["beneficio", "custo"];

function validarTipo(tipo) {
  if (!TIPOS.includes(tipo)) {
    throw new AppError("Tipo deve ser 'beneficio' ou 'custo'.", 400);
  }

  return tipo;
}

function validarPeso(peso) {
  const numero = vazio(peso) ? 0 : paraNumero(peso);

  if (!Number.isFinite(numero) || numero < 0 || numero > 1) {
    throw new AppError("Peso deve estar entre 0 e 1.", 400);
  }

  return numero;
}

function textoOpcional(valor) {
  return vazio(valor) ? null : String(valor).trim();
}

function montarDados(corpo, { parcial = false } = {}) {
  const { codigo, nome, descricao, tipo, peso, unidade, fonte, ativo } =
    corpo ?? {};
  const dados = {};

  if (!parcial || nome !== undefined) {
    if (vazio(nome)) throw new AppError("Nome é obrigatório.", 400);
    dados.nome = String(nome).trim();
  }

  if (!parcial || tipo !== undefined) {
    dados.tipo = validarTipo(tipo);
  }

  if (!parcial || peso !== undefined) dados.peso = validarPeso(peso);

  if (!parcial || codigo !== undefined) {
    dados.codigo = textoOpcional(codigo)?.toUpperCase() ?? null;
  }

  if (!parcial || descricao !== undefined) dados.descricao = textoOpcional(descricao);
  if (!parcial || unidade !== undefined) dados.unidade = textoOpcional(unidade);
  if (!parcial || fonte !== undefined) dados.fonte = textoOpcional(fonte);
  if (ativo !== undefined) dados.ativo = Boolean(ativo);

  return dados;
}

async function garantirCodigoUnico(codigo, idAtual) {
  if (!codigo) return;

  const criterios = await criteriosRepository.listar();
  const duplicado = criterios.find(
    (criterio) =>
      criterio.codigo?.toUpperCase() === codigo && criterio.id !== idAtual
  );

  if (duplicado) {
    throw new AppError(`Já existe um critério com o código ${codigo}.`, 409);
  }
}

function listar({ somenteAtivos = false } = {}) {
  return criteriosRepository.listar({ somenteAtivos });
}

async function buscar(id) {
  const criterio = await criteriosRepository.buscarPorId(id);

  if (!criterio) throw new AppError("Critério não encontrado.", 404);

  return criterio;
}

async function criar(corpo) {
  const dados = montarDados(corpo);
  await garantirCodigoUnico(dados.codigo);

  return criteriosRepository.criar(dados);
}

async function atualizar(id, corpo) {
  const dados = montarDados(corpo, { parcial: true });
  await garantirCodigoUnico(dados.codigo, id);
  dados.updated_at = new Date().toISOString();

  const criterio = await criteriosRepository.atualizar(id, dados);

  if (!criterio) throw new AppError("Critério não encontrado.", 404);

  return criterio;
}

// Os pesos padrão (RF03) são salvos em lote, validando soma = 1
// entre os critérios ativos.
async function atualizarPesos(lista) {
  if (!Array.isArray(lista) || lista.length === 0) {
    throw new AppError("Informe a lista de pesos.", 400);
  }

  const ativos = await criteriosRepository.listar({ somenteAtivos: true });
  const novosPesos = new Map(ativos.map((c) => [c.id, Number(c.peso)]));

  for (const item of lista) {
    const id = Number(item?.criterio_id);

    if (!novosPesos.has(id)) {
      throw new AppError(`Critério ativo ${item?.criterio_id} não encontrado.`, 400);
    }

    novosPesos.set(id, validarPeso(item.peso));
  }

  const soma = [...novosPesos.values()].reduce((total, peso) => total + peso, 0);

  if (Math.abs(soma - 1) > 0.001) {
    throw new AppError("A soma dos pesos deve ser igual a 100%.", 400);
  }

  const agora = new Date().toISOString();

  for (const item of lista) {
    await criteriosRepository.atualizar(Number(item.criterio_id), {
      peso: novosPesos.get(Number(item.criterio_id)),
      updated_at: agora
    });
  }

  return criteriosRepository.listar({ somenteAtivos: true });
}

// Critérios não são apagados fisicamente para preservar o histórico.
async function desativar(id) {
  return atualizar(id, { ativo: false });
}

module.exports = {
  TIPOS,
  listar,
  buscar,
  criar,
  atualizar,
  atualizarPesos,
  desativar
};
