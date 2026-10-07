const express = require("express");
const criteriosController = require("../controllers/criterios.controller");
const { autorizar } = require("../middleware/auth.middleware");

const router = express.Router();

const podeConfigurar = autorizar("admin", "pesquisador");

/**
 * @swagger
 * /api/criterios:
 *   get:
 *     tags: [Critérios]
 *     summary: Lista os critérios (C1 a C7)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: ativos
 *         schema: { type: boolean }
 *         description: Quando true, retorna apenas os critérios ativos.
 *     responses:
 *       200:
 *         description: Lista de critérios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sucesso: { type: boolean }
 *                 criterios:
 *                   type: array
 *                   items: { $ref: "#/components/schemas/Criterio" }
 *       401: { $ref: "#/components/responses/NaoAutenticado" }
 *   post:
 *     tags: [Critérios]
 *     summary: Cadastra um critério (admin)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/CriterioEntrada" }
 *     responses:
 *       201: { description: Critério cadastrado }
 *       400: { $ref: "#/components/responses/DadosInvalidos" }
 *       401: { $ref: "#/components/responses/NaoAutenticado" }
 *       403: { $ref: "#/components/responses/SemPermissao" }
 *       409: { description: Código já utilizado }
 */
router.get("/", criteriosController.listar);
router.post("/", autorizar("admin"), criteriosController.criar);

/**
 * @swagger
 * /api/criterios/pesos:
 *   put:
 *     tags: [Critérios]
 *     summary: Salva os pesos padrão dos critérios (admin, pesquisador)
 *     description: A soma dos pesos dos critérios ativos deve ser 1 (100%).
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pesos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     criterio_id: { type: integer }
 *                     peso: { type: number }
 *             example:
 *               pesos:
 *                 - { criterio_id: 1, peso: 0.20 }
 *                 - { criterio_id: 2, peso: 0.20 }
 *                 - { criterio_id: 3, peso: 0.15 }
 *                 - { criterio_id: 4, peso: 0.25 }
 *                 - { criterio_id: 5, peso: 0.20 }
 *                 - { criterio_id: 6, peso: 0 }
 *                 - { criterio_id: 7, peso: 0 }
 *     responses:
 *       200: { description: Pesos atualizados }
 *       400: { $ref: "#/components/responses/DadosInvalidos" }
 *       401: { $ref: "#/components/responses/NaoAutenticado" }
 *       403: { $ref: "#/components/responses/SemPermissao" }
 */
router.put("/pesos", podeConfigurar, criteriosController.atualizarPesos);

/**
 * @swagger
 * /api/criterios/{id}:
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema: { type: integer }
 *   get:
 *     tags: [Critérios]
 *     summary: Busca um critério
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Critério encontrado }
 *       401: { $ref: "#/components/responses/NaoAutenticado" }
 *       404: { $ref: "#/components/responses/NaoEncontrado" }
 *   put:
 *     tags: [Critérios]
 *     summary: Atualiza tipo, peso e dados de um critério (admin, pesquisador)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/CriterioEntrada" }
 *     responses:
 *       200: { description: Critério atualizado }
 *       400: { $ref: "#/components/responses/DadosInvalidos" }
 *       401: { $ref: "#/components/responses/NaoAutenticado" }
 *       403: { $ref: "#/components/responses/SemPermissao" }
 *       404: { $ref: "#/components/responses/NaoEncontrado" }
 *   delete:
 *     tags: [Critérios]
 *     summary: Desativa um critério (admin)
 *     description: O critério não é apagado, apenas desativado, para preservar o histórico.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Critério desativado }
 *       401: { $ref: "#/components/responses/NaoAutenticado" }
 *       403: { $ref: "#/components/responses/SemPermissao" }
 *       404: { $ref: "#/components/responses/NaoEncontrado" }
 */
router.get("/:id", criteriosController.buscar);
router.put("/:id", podeConfigurar, criteriosController.atualizar);
router.delete("/:id", autorizar("admin"), criteriosController.desativar);

module.exports = router;
