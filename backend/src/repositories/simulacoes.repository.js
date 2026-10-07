const supabase = require("../config/supabase");
const { resultado } = require("./base.repository");

async function criar(dados) {
  return resultado(
    await supabase.from("simulacoes").insert(dados).select("*").single()
  );
}

async function atualizarStatus(id, status) {
  return resultado(
    await supabase.from("simulacoes").update({ status }).eq("id", id)
  );
}

async function listar({
  usuarioId,
  status,
  dataInicio,
  dataFim,
  limite,
  deslocamento
}) {
  let consulta = supabase
    .from("simulacoes")
    .select("*", { count: "exact" });

  if (usuarioId !== undefined) consulta = consulta.eq("usuario_id", usuarioId);
  if (status) consulta = consulta.eq("status", status);
  if (dataInicio) consulta = consulta.gte("data_execucao", dataInicio);
  if (dataFim) consulta = consulta.lte("data_execucao", dataFim);

  const { data, error, count } = await consulta
    .order("id", { ascending: false })
    .range(deslocamento, deslocamento + limite - 1);

  if (error) throw error;

  return { simulacoes: data, total: count ?? data.length };
}

async function buscarPorId(id) {
  return resultado(
    await supabase.from("simulacoes").select("*").eq("id", id).maybeSingle()
  );
}

async function salvarResultados(registros) {
  return resultado(
    await supabase.from("resultados_ranking").insert(registros)
  );
}

async function listarResultados(simulacaoId) {
  return resultado(
    await supabase
      .from("resultados_ranking")
      .select("*")
      .eq("simulacao_id", simulacaoId)
      .order("posicao", { ascending: true })
  );
}

module.exports = {
  criar,
  atualizarStatus,
  listar,
  buscarPorId,
  salvarResultados,
  listarResultados
};
