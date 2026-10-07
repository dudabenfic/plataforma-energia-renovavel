const express = require("express");
const topsisController = require("../controllers/topsis.controller");

const router = express.Router();

/**
 * @swagger
 * /api/topsis/executar:
 *   post:
 *     tags: [TOPSIS]
 *     summary: Executa o cálculo TOPSIS e grava a simulação
 *     description: |
 *       Calcula o ranking dos municípios com os critérios ativos (C1 a C7).
 *       Etapas: matriz de decisão → normalização vetorial → matriz ponderada →
 *       soluções ideais positiva e negativa → distâncias euclidianas →
 *       coeficiente Ci = D- / (D+ + D-) → ranking (maior Ci = menos vulnerável).
 *
 *       A simulação é registrada com o usuário autenticado.
 *       Sem `pesos`, são usados os pesos cadastrados nos critérios.
 *       Municípios sem valor em algum critério com peso > 0 são ignorados e
 *       listados em `municipiosIgnorados`.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pesos:
 *                 description: >
 *                   Lista de números na ordem dos critérios ativos (C1..C7) ou
 *                   lista de objetos { criterio_id, peso }. A soma deve ser 1.
 *                 type: array
 *                 items: {}
 *                 example: [0.20, 0.20, 0.15, 0.25, 0.20, 0, 0]
 *               ano_referencia:
 *                 type: integer
 *                 example: 2026
 *               municipio_ids:
 *                 type: array
 *                 items: { type: integer }
 *                 description: Restringe a análise a estes municípios (opcional).
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Ranking calculado e simulação registrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sucesso: { type: boolean }
 *                 simulacao: { $ref: "#/components/schemas/Simulacao" }
 *                 pesos: { type: array, items: { type: number }, example: [0.2, 0.2, 0.15, 0.25, 0.2, 0, 0] }
 *                 ano_referencia: { type: integer, example: 2026 }
 *                 tempoCalculoMs: { type: integer, example: 120 }
 *                 criterios:
 *                   type: array
 *                   items: { $ref: "#/components/schemas/Criterio" }
 *                 municipios:
 *                   type: array
 *                   items: { $ref: "#/components/schemas/Municipio" }
 *                 municipiosIgnorados:
 *                   type: array
 *                   items: { type: object }
 *                 ranking:
 *                   type: array
 *                   items: { $ref: "#/components/schemas/ResultadoTopsis" }
 *       400:
 *         description: Pesos inválidos, soma diferente de 100% ou dados insuficientes
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Erro" }
 *             example: { sucesso: false, erro: "A soma dos pesos deve ser igual a 100%." }
 *       401: { $ref: "#/components/responses/NaoAutenticado" }
 *       500: { $ref: "#/components/responses/ErroInterno" }
 */
router.post("/executar", topsisController.executar);

module.exports = router;
