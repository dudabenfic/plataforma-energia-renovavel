// O Supabase (PostgREST) limita cada consulta a 1000 linhas por padrão.
// Para matrizes grandes (ex.: 500 municípios x 7 critérios) é preciso paginar.
const TAMANHO_PAGINA = 1000;

async function buscarTodos(criarConsulta) {
  const registros = [];
  let inicio = 0;

  while (true) {
    const { data, error } = await criarConsulta().range(
      inicio,
      inicio + TAMANHO_PAGINA - 1
    );

    if (error) throw error;

    registros.push(...data);

    if (data.length < TAMANHO_PAGINA) break;

    inicio += TAMANHO_PAGINA;
  }

  return registros;
}

function resultado({ data, error }) {
  if (error) throw error;
  return data;
}

module.exports = { buscarTodos, resultado, TAMANHO_PAGINA };
