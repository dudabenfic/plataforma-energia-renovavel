const supabase = require("../config/supabase");
const { buscarTodos, resultado } = require("./base.repository");

const TABELA = "municipios";

function listar() {
  return buscarTodos(() =>
    supabase.from(TABELA).select("*").order("nome", { ascending: true })
  );
}

async function listarPorIds(ids) {
  if (ids.length === 0) return [];

  return resultado(await supabase.from(TABELA).select("*").in("id", ids));
}

async function buscarPorId(id) {
  return resultado(
    await supabase.from(TABELA).select("*").eq("id", id).maybeSingle()
  );
}

async function criar(dados) {
  return resultado(
    await supabase.from(TABELA).insert(dados).select("*").single()
  );
}

async function criarVarios(lista) {
  if (lista.length === 0) return [];

  return resultado(await supabase.from(TABELA).insert(lista).select("*"));
}

async function atualizar(id, dados) {
  return resultado(
    await supabase
      .from(TABELA)
      .update(dados)
      .eq("id", id)
      .select("*")
      .maybeSingle()
  );
}

async function remover(id) {
  return resultado(
    await supabase.from(TABELA).delete().eq("id", id).select("id")
  );
}

module.exports = {
  listar,
  listarPorIds,
  buscarPorId,
  criar,
  criarVarios,
  atualizar,
  remover
};
