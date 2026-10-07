const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const { env } = require("./config/env");
const swaggerSpec = require("./swagger");
const rotas = require("./routes");
const { rotaNaoEncontrada, tratarErros } = require("./middleware/error.middleware");

const app = express();

// CORS_ORIGIN vazio libera qualquer origem; em produção, informe a URL do frontend.
const origens = env.CORS_ORIGIN.split(",")
  .map((origem) => origem.trim())
  .filter(Boolean);

app.use(cors(origens.length > 0 ? { origin: origens } : undefined));
app.use(express.json({ limit: "1mb" }));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));

/**
 * @swagger
 * /:
 *   get:
 *     tags: [Status]
 *     summary: Verifica se a API está funcionando
 *     responses:
 *       200:
 *         description: API funcionando corretamente
 *         content:
 *           application/json:
 *             example: { message: "API Plataforma de Energia Renovável funcionando!" }
 */
app.get("/", (req, res) => {
  res.json({
    message: "API Plataforma de Energia Renovável funcionando!"
  });
});

app.use("/api", rotas);

app.use(rotaNaoEncontrada);
app.use(tratarErros);

module.exports = app;
