const supabase = require("../config/supabase");
const { buscarTodos, resultado } = require("./base.repository");

const TABELA = "matriz_decisao";
const TAMANHO_LOTE = 500;

function listar({ anoReferencia, municipioId } = {}) {
  return buscarTodos(() => {
    let consulta = supabase.from(TABELA).select("*");

    if (anoReferencia !== undefined) {
      consulta = consulta.eq("ano_referencia", anoReferencia);
    }

    if (municipioId !== undefined) {
      consulta = consulta.eq("municipio_id", municipioId);
    }

    return consulta.order("municipio_id").order("criterio_id").order("id");
  });
}

async function listarAnos() {
  const registros = await buscarTodos(() =>
    supabase
      .from(TABELA)
      .select("ano_referencia")
      .order("ano_referencia", { ascending: false })
  );

  return [...new Set(registros.map((r) => r.ano_referencia))].filter(
    (ano) => ano !== null
  );
}

// Grava (insere ou atualiza) valores usando a chave única
// (municipio_id, criterio_id, ano_referencia).
async function salvarValores(registros) {
  for (let i = 0; i < registros.length; i += TAMANHO_LOTE) {
    resultado(
      await supabase
        .from(TABELA)
        .upsert(registros.slice(i, i + TAMANHO_LOTE), {
          onConflict: "municipio_id,criterio_id,ano_referencia"
        })
    );
  }

  return registros.length;
}

module.exports = { listar, listarAnos, salvarValores };
