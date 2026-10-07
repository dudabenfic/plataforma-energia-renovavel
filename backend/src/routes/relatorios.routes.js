const express = require("express");
const relatoriosController = require("../controllers/relatorios.controller");

const router = express.Router();

/**
 * @swagger
 * /api/relatorios/{id}/csv:
 *   get:
 *     tags: [Relatórios]
 *     summary: Exporta o ranking de uma simulação em CSV
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
router.get("/:id/csv", relatoriosController.csv);

/**
 * @swagger
 * /api/relatorios/{id}/pdf:
 *   get:
 *     tags: [Relatórios]
 *     summary: Exporta o relatório de uma simulação em PDF
 *     description: Título, data, responsável, critérios com tipo e peso, ranking (Ci, D+, D-) e faixas de vulnerabilidade.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Arquivo PDF
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 *       400: { $ref: "#/components/responses/DadosInvalidos" }
 *       401: { $ref: "#/components/responses/NaoAutenticado" }
 *       404: { $ref: "#/components/responses/NaoEncontrado" }
 */
router.get("/:id/pdf", relatoriosController.pdf);

module.exports = router;
