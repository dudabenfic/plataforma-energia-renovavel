const express = require("express");
const cors = require("cors");
const { topsis } = require("./services/topsis.service");
const supabase = require("./config/supabase");
const multer = require("multer");
const { parse } = require("csv-parse/sync");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const upload = multer({
  storage: multer.memoryStorage()
});

const app = express();

app.use(cors());
app.use(express.json());

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

/**
 * @swagger
 * /:
 *   get:
 *     summary: Verifica se a API está funcionando
 *     responses:
 *       200:
 *         description: API funcionando corretamente
 */
app.get("/", (req, res) => {
  res.json({
    message: "API Plataforma de Energia Renovável funcionando!"
  });
});

const PORT = 3001;

/**
 * @swagger
 * /api/topsis/executar:
 *   post:
 *     summary: Executa o cálculo TOPSIS
 *     description: Calcula o ranking dos municípios utilizando os pesos informados.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pesos:
 *                 type: array
 *                 items:
 *                   type: number
 *                 example: [0.20, 0.20, 0.15, 0.25, 0.20]
 *     responses:
 *       200:
 *         description: Ranking TOPSIS calculado com sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno
 */
app.post("/api/topsis/executar", async (req, res) => {
  try {
    const { pesos: pesosRecebidos } = req.body;
    // Buscar municípios
    const { data: municipios, error: municipiosError } =
      await supabase
        .from("municipios")
        .select("*")
        .order("id");

    if (municipiosError) {
      throw municipiosError;
    }

    // Buscar critérios
    const { data: criterios, error: criteriosError } =
      await supabase
        .from("criterios")
        .select("*")
        .order("id");

    if (criteriosError) {
      throw criteriosError;
    }

    // Buscar matriz de decisão
    const { data: matrizDados, error: matrizError } =
      await supabase
        .from("matriz_decisao")
        .select("*")
        .order("municipio_id")
        .order("criterio_id");

    if (matrizError) {
      throw matrizError;
    }

    // Montar matriz para o TOPSIS
    const matriz = municipios.map((municipio) => {
      return criterios.map((criterio) => {
        const registro = matrizDados.find(
          (item) =>
            item.municipio_id === municipio.id &&
            item.criterio_id === criterio.id
        );

        return registro ? Number(registro.valor) : 0;
      });
    });

    // Pesos dos critérios
    const pesosBanco = criterios.map((criterio) => Number(criterio.peso));

    const pesos =
    Array.isArray(pesosRecebidos) &&
    pesosRecebidos.length === criterios.length
        ? pesosRecebidos.map(Number)
        : pesosBanco;
    // Tipos: benefício ou custo
    const tipos = criterios.map((criterio) => criterio.tipo);

    const somaPesos = pesos.reduce(
        (soma, peso) => soma + peso,
        0
        );

    if (Math.abs(somaPesos - 1) > 0.0001) {
        return res.status(400).json({
            sucesso: false,
            erro: "A soma dos pesos deve ser igual a 100%."
        });
    }
    // Executar TOPSIS
    const ranking = topsis(matriz, pesos, tipos);

    // Adicionar informações dos municípios
    const rankingCompleto = ranking.map((resultado) => ({
      ...resultado,
      municipio: municipios[resultado.indice].nome,
      uf: municipios[resultado.indice].uf
    }));

    const { data: simulacao, error: simulacaoError } =
    await supabase
        .from("simulacoes")
        .insert({
        parametros: {
            pesos,
            tipos
        },
        status: "concluida"
        })
        .select()
        .single();

    if (simulacaoError) {
    throw simulacaoError;
    }

     const resultadosParaSalvar = ranking.map((resultado) => ({
    simulacao_id: simulacao.id,
    municipio_id: municipios[resultado.indice].id,
    coeficiente_ci: resultado.ci,
    distancia_positiva: resultado.distanciaPositiva,
    distancia_negativa: resultado.distanciaNegativa,
    posicao: resultado.posicao
    }));

    const { error: resultadosError } =
    await supabase
        .from("resultados_ranking")
        .insert(resultadosParaSalvar);

    if (resultadosError) {
    throw resultadosError;
    }

    res.json({
      sucesso: true,
      municipios,
      criterios,
      ranking: rankingCompleto
    });

  } catch (error) {
    console.error("Erro ao executar TOPSIS:", error);

    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
});

/**
 * @swagger
 * /api/simulacoes:
 *   get:
 *     summary: Lista o histórico de simulações
 *     responses:
 *       200:
 *         description: Histórico retornado com sucesso
 *       500:
 *         description: Erro interno
 */
app.get("/api/simulacoes", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("simulacoes")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      sucesso: true,
      simulacoes: data
    });

  } catch (error) {
    console.error("Erro ao buscar simulações:", error);

    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
});

console.log("✅ Cliente Supabase configurado!");

app.post("/api/importar-csv", upload.single("arquivo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        sucesso: false,
        erro: "Nenhum arquivo CSV foi enviado."
      });
    }

    const registros = parse(req.file.buffer.toString("utf-8"), {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      trim: true
    });

    if (registros.length === 0) {
      return res.status(400).json({
        sucesso: false,
        erro: "O CSV está vazio."
      });
    }

    const { data: criterios, error: criteriosError } =
      await supabase
        .from("criterios")
        .select("*")
        .order("id");

    if (criteriosError) {
      throw criteriosError;
    }

    const criteriosPorNome = {
      acesso_eletricidade: criterios.find(
        (c) => c.id === 1
      ),
      energia_solar: criterios.find(
        (c) => c.id === 2
      ),
      renda_per_capita: criterios.find(
        (c) => c.id === 3
      ),
      tarifa: criterios.find(
        (c) => c.id === 4
      ),
      irradiacao: criterios.find(
        (c) => c.id === 5
      )
    };

    for (const registro of registros) {
      const { data: municipioExistente, error: buscaError } =
        await supabase
          .from("municipios")
          .select("*")
          .eq("nome", registro.nome)
          .eq("uf", registro.uf)
          .maybeSingle();

      if (buscaError) {
        throw buscaError;
      }

      let municipio;

      if (municipioExistente) {
        const { data, error } = await supabase
          .from("municipios")
          .update({
            populacao: Number(registro.populacao),
            idh: Number(registro.idh)
          })
          .eq("id", municipioExistente.id)
          .select()
          .single();

        if (error) throw error;

        municipio = data;
      } else {
        const { data, error } = await supabase
          .from("municipios")
          .insert({
            nome: registro.nome,
            uf: registro.uf,
            populacao: Number(registro.populacao),
            idh: Number(registro.idh)
          })
          .select()
          .single();

        if (error) throw error;

        municipio = data;
      }

      const valores = {
        acesso_eletricidade: registro.acesso_eletricidade,
        energia_solar: registro.energia_solar,
        renda_per_capita: registro.renda_per_capita,
        tarifa: registro.tarifa,
        irradiacao: registro.irradiacao
      };

      for (const [campo, valor] of Object.entries(valores)) {
        const criterio = criteriosPorNome[campo];

        if (!criterio || valor === undefined || valor === "") {
          continue;
        }

        const { error } = await supabase
          .from("matriz_decisao")
          .upsert(
            {
              municipio_id: municipio.id,
              criterio_id: criterio.id,
              valor: Number(valor),
              ano_referencia: Number(registro.ano)
            },
            {
              onConflict:
                "municipio_id,criterio_id,ano_referencia"
            }
          );

        if (error) throw error;
      }
    }

    res.json({
      sucesso: true,
      mensagem: `${registros.length} município(s) importado(s) com sucesso.`
    });

  } catch (error) {
    console.error("Erro na importação:", error);

    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

module.exports = app;