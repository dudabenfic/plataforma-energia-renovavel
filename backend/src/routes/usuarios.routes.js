const express = require("express");
const usuariosController = require("../controllers/usuarios.controller");
const { autorizar } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(autorizar("admin"));

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     tags: [Usuários]
 *     summary: Lista os usuários (admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Lista de usuários (sem senha)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sucesso: { type: boolean }
 *                 usuarios:
 *                   type: array
 *                   items: { $ref: "#/components/schemas/Usuario" }
 *       401: { $ref: "#/components/responses/NaoAutenticado" }
 *       403: { $ref: "#/components/responses/SemPermissao" }
 */
router.get("/", usuariosController.listar);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   patch:
 *     tags: [Usuários]
 *     summary: Altera perfil e/ou status de um usuário (admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               perfil: { type: string, enum: [admin, pesquisador, gestor] }
 *               ativo: { type: boolean }
 *     responses:
 *       200: { description: Usuário atualizado }
 *       400: { $ref: "#/components/responses/DadosInvalidos" }
 *       401: { $ref: "#/components/responses/NaoAutenticado" }
 *       403: { $ref: "#/components/responses/SemPermissao" }
 *       404: { $ref: "#/components/responses/NaoEncontrado" }
 */
router.patch("/:id", usuariosController.atualizar);

module.exports = router;
