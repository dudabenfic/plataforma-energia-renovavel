const supabase = require("../config/supabase");
const { resultado } = require("./base.repository");

const TABELA = "usuarios";

// Campos seguros para retornar ao cliente (nunca inclui senha_hash).
const CAMPOS_PUBLICOS = "id, nome, email, perfil, ativo, created_at";

async function buscarPorEmailComSenha(email) {
  return resultado(
    await supabase
      .from(TABELA)
      .select("id, nome, email, perfil, ativo, senha_hash")
      .eq("email", email)
      .maybeSingle()
  );
}

async function existeEmail(email) {
  const data = resultado(
    await supabase.from(TABELA).select("id").eq("email", email).maybeSingle()
  );

  return Boolean(data);
}

async function buscarPorId(id) {
  return resultado(
    await supabase
      .from(TABELA)
      .select(CAMPOS_PUBLICOS)
      .eq("id", id)
      .maybeSingle()
  );
}

async function listar() {
  return resultado(
    await supabase
      .from(TABELA)
      .select(CAMPOS_PUBLICOS)
      .order("id", { ascending: true })
  );
}

async function listarNomesPorIds(ids) {
  if (ids.length === 0) return [];

  return resultado(
    await supabase.from(TABELA).select("id, nome").in("id", ids)
  );
}

async function criar(dados) {
  return resultado(
    await supabase.from(TABELA).insert(dados).select(CAMPOS_PUBLICOS).single()
  );
}

async function atualizar(id, dados) {
  return resultado(
    await supabase
      .from(TABELA)
      .update(dados)
      .eq("id", id)
      .select(CAMPOS_PUBLICOS)
      .maybeSingle()
  );
}

module.exports = {
  buscarPorEmailComSenha,
  existeEmail,
  buscarPorId,
  listar,
  listarNomesPorIds,
  criar,
  atualizar
};
