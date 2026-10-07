const express = require("express");
const simulacoesController = require("../controllers/simulacoes.controller");

const router = express.Router();

/**
 * @swagger
 * /api/relatorios/{id}/csv:
 *   get:
 *     tags: [Relatórios]
 *     summary: Exporta o ranking de uma simulação em CSV
 *     description: O relatório em PDF é gerado pela interface web a partir de GET /api/simulacoes/{id}.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Arquivo CSV
 *         content:
 *           text/csv:
 *             example: "posicao,municipio,uf,coeficiente_ci,distancia_positiva,distancia_negativa,simulacao_id,data_execucao"
 *       401: { $ref: "#/components/responses/NaoAutenticado" }
 *       404: { $ref: "#/components/responses/NaoEncontrado" }
 */
router.get("/:id/csv", simulacoesController.relatorioCsv);

module.exports = router;
