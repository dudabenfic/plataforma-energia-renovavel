const express = require("express");
const indicadoresController = require("../controllers/indicadores.controller");

const router = express.Router();

/**
 * @swagger
 * /api/indicadores:
 *   get:
 *     tags: [Indicadores]
 *     summary: Retorna a matriz de decisão (municípios x critérios ativos)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: ano
 *         schema: { type: integer, example: 2026 }
 *         description: Ano de referência. Se omitido, usa o ano mais recente.
 *     responses:
 *       200:
 *         description: Matriz de decisão
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sucesso: { type: boolean }
 *                 anos: { type: array, items: { type: integer }, example: [2026] }
 *                 ano_referencia: { type: integer, example: 2026 }
 *                 criterios:
 *                   type: array
 *                   items: { $ref: "#/components/schemas/Criterio" }
 *                 municipios:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: "#/components/schemas/Municipio"
 *                       - type: object
 *                         properties:
 *                           valores:
 *                             type: object
 *                             description: Valores indexados pelo id do critério
 *                             example: { "1": 15, "2": 0.8, "3": 980, "4": 0.75, "5": 5.2, "6": 18, "7": 4 }
 *       400: { $ref: "#/components/responses/DadosInvalidos" }
 *       401: { $ref: "#/components/responses/NaoAutenticado" }
 */
router.get("/", indicadoresController.listarMatriz);

module.exports = router;
