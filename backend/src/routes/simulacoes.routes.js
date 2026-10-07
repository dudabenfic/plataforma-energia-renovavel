const express = require("express");
const simulacoesController = require("../controllers/simulacoes.controller");

const router = express.Router();

/**
 * @swagger
 * /api/simulacoes:
 *   get:
 *     tags: [Simulações]
 *     summary: Lista o histórico de simulações
 *     description: Simulações anteriores à autenticação possuem usuario_id nulo.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: minhas, schema: { type: boolean }, description: "Somente simulações do usuário logado" }
 *       - { in: query, name: usuario_id, schema: { type: integer } }
 *       - { in: query, name: status, schema: { type: string, enum: [concluida, erro, processando] } }
 *       - { in: query, name: data_inicio, schema: { type: string, format: date, example: "2026-10-01" } }
 *       - { in: query, name: data_fim, schema: { type: string, format: date, example: "2026-10-31" } }
 *       - { in: query, name: limite, schema: { type: integer, default: 50, maximum: 200 } }
 *       - { in: query, name: deslocamento, schema: { type: integer, default: 0 } }
 *     responses:
 *       200:
 *         description: Histórico retornado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sucesso: { type: boolean }
 *                 total: { type: integer }
 *                 limite: { type: integer }
 *                 deslocamento: { type: integer }
 *                 simulacoes:
 *                   type: array
 *                   items: { $ref: "#/components/schemas/Simulacao" }
 *       400: { $ref: "#/components/responses/DadosInvalidos" }
 *       401: { $ref: "#/components/responses/NaoAutenticado" }
 *       500: { $ref: "#/components/responses/ErroInterno" }
 */
router.get("/", simulacoesController.listar);

/**
 * @swagger
 * /api/simulacoes/{id}:
 *   get:
 *     tags: [Simulações]
 *     summary: Detalha uma simulação (parâmetros, usuário e ranking)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Simulação encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sucesso: { type: boolean }
 *                 simulacao: { $ref: "#/components/schemas/Simulacao" }
 *                 ranking:
 *                   type: array
 *                   items: { $ref: "#/components/schemas/ResultadoRanking" }
 *       400: { $ref: "#/components/responses/DadosInvalidos" }
 *       401: { $ref: "#/components/responses/NaoAutenticado" }
 *       404: { $ref: "#/components/responses/NaoEncontrado" }
 */
router.get("/:id", simulacoesController.buscar);

module.exports = router;
