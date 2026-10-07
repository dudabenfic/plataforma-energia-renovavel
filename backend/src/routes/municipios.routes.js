const express = require("express");
const municipiosController = require("../controllers/municipios.controller");
const { autorizar } = require("../middleware/auth.middleware");

const router = express.Router();

const podeEditar = autorizar("admin", "pesquisador");

/**
 * @swagger
 * /api/municipios:
 *   get:
 *     tags: [Municípios]
 *     summary: Lista os municípios
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Lista de municípios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sucesso: { type: boolean }
 *                 municipios:
 *                   type: array
 *                   items: { $ref: "#/components/schemas/Municipio" }
 *       401: { $ref: "#/components/responses/NaoAutenticado" }
 *   post:
 *     tags: [Municípios]
 *     summary: Cadastra um município (admin, pesquisador)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/MunicipioEntrada" }
 *     responses:
 *       201: { description: Município cadastrado }
 *       400: { $ref: "#/components/responses/DadosInvalidos" }
 *       401: { $ref: "#/components/responses/NaoAutenticado" }
 *       403: { $ref: "#/components/responses/SemPermissao" }
 */
router.get("/", municipiosController.listar);
router.post("/", podeEditar, municipiosController.criar);

/**
 * @swagger
 * /api/municipios/{id}:
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema: { type: integer }
 *   get:
 *     tags: [Municípios]
 *     summary: Busca um município
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Município encontrado }
 *       400: { $ref: "#/components/responses/DadosInvalidos" }
 *       401: { $ref: "#/components/responses/NaoAutenticado" }
 *       404: { $ref: "#/components/responses/NaoEncontrado" }
 *   put:
 *     tags: [Municípios]
 *     summary: Atualiza um município (admin, pesquisador)
 *     description: Apenas os campos enviados são alterados.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/MunicipioEntrada" }
 *     responses:
 *       200: { description: Município atualizado }
 *       400: { $ref: "#/components/responses/DadosInvalidos" }
 *       401: { $ref: "#/components/responses/NaoAutenticado" }
 *       403: { $ref: "#/components/responses/SemPermissao" }
 *       404: { $ref: "#/components/responses/NaoEncontrado" }
 *   delete:
 *     tags: [Municípios]
 *     summary: Exclui um município (admin)
 *     description: Remove também os indicadores e resultados de ranking associados.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Município excluído }
 *       401: { $ref: "#/components/responses/NaoAutenticado" }
 *       403: { $ref: "#/components/responses/SemPermissao" }
 *       404: { $ref: "#/components/responses/NaoEncontrado" }
 */
router.get("/:id", municipiosController.buscar);
router.put("/:id", podeEditar, municipiosController.atualizar);
router.delete("/:id", autorizar("admin"), municipiosController.remover);

/**
 * @swagger
 * /api/municipios/{id}/indicadores:
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema: { type: integer }
 *   get:
 *     tags: [Indicadores]
 *     summary: Lista os indicadores (matriz de decisão) de um município
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Indicadores do município (todos os anos)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sucesso: { type: boolean }
 *                 indicadores:
 *                   type: array
 *                   items: { $ref: "#/components/schemas/Indicador" }
 *       401: { $ref: "#/components/responses/NaoAutenticado" }
 *       404: { $ref: "#/components/responses/NaoEncontrado" }
 *   put:
 *     tags: [Indicadores]
 *     summary: Grava os indicadores de um município em um ano (admin, pesquisador)
 *     description: Cada valor pode ser identificado por criterio_id ou pelo código do critério.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ano_referencia, valores]
 *             properties:
 *               ano_referencia: { type: integer, example: 2026 }
 *               valores:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     criterio_id: { type: integer }
 *                     codigo: { type: string }
 *                     valor: { type: number }
 *             example:
 *               ano_referencia: 2026
 *               valores:
 *                 - { codigo: "C1", valor: 15 }
 *                 - { codigo: "C2", valor: 0.8 }
 *                 - { codigo: "C3", valor: 980 }
 *                 - { codigo: "C4", valor: 0.75 }
 *                 - { codigo: "C5", valor: 5.2 }
 *                 - { codigo: "C6", valor: 18 }
 *                 - { codigo: "C7", valor: 4 }
 *     responses:
 *       200: { description: Indicadores gravados }
 *       400: { $ref: "#/components/responses/DadosInvalidos" }
 *       401: { $ref: "#/components/responses/NaoAutenticado" }
 *       403: { $ref: "#/components/responses/SemPermissao" }
 *       404: { $ref: "#/components/responses/NaoEncontrado" }
 */
router.get("/:id/indicadores", municipiosController.listarIndicadores);
router.put("/:id/indicadores", podeEditar, municipiosController.salvarIndicadores);

module.exports = router;
