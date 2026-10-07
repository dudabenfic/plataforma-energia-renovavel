const supabase = require("../config/supabase");
const { resultado } = require("./base.repository");

const TABELA = "criterios";

async function listar({ somenteAtivos = false } = {}) {
  let consulta = supabase.from(TABELA).select("*");

  if (somenteAtivos) {
    consulta = consulta.eq("ativo", true);
  }

  return resultado(await consulta.order("id", { ascending: true }));
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

module.exports = { listar, buscarPorId, criar, atualizar };
