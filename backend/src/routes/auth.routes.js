const express = require("express");
const authController = require("../controllers/auth.controller");
const { autenticar } = require("../middleware/auth.middleware");

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Autenticação]
 *     summary: Cadastra um novo usuário
 *     description: A senha é armazenada com hash bcrypt. Novos usuários recebem o perfil "pesquisador".
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome, email, senha]
 *             properties:
 *               nome: { type: string, example: "Maria" }
 *               email: { type: string, example: "maria@email.com" }
 *               senha: { type: string, minLength: 6, example: "senha123" }
 *     responses:
 *       201:
 *         description: Usuário cadastrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sucesso: { type: boolean }
 *                 usuario: { $ref: "#/components/schemas/Usuario" }
 *       400: { $ref: "#/components/responses/DadosInvalidos" }
 *       409:
 *         description: E-mail já cadastrado
 *       500: { $ref: "#/components/responses/ErroInterno" }
 */
router.post("/register", authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Autenticação]
 *     summary: Autentica o usuário e retorna um token JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, senha]
 *             properties:
 *               email: { type: string, example: "maria@email.com" }
 *               senha: { type: string, example: "senha123" }
 *     responses:
 *       200:
 *         description: Login realizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sucesso: { type: boolean }
 *                 token: { type: string, description: "JWT (Authorization Bearer)" }
 *                 expiraEm: { type: string, example: "8h" }
 *                 usuario: { $ref: "#/components/schemas/Usuario" }
 *       400: { $ref: "#/components/responses/DadosInvalidos" }
 *       401:
 *         description: E-mail ou senha inválidos
 *       403:
 *         description: Usuário inativo
 *       500: { $ref: "#/components/responses/ErroInterno" }
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Autenticação]
 *     summary: Retorna o usuário autenticado
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Usuário autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sucesso: { type: boolean }
 *                 usuario: { $ref: "#/components/schemas/Usuario" }
 *       401: { $ref: "#/components/responses/NaoAutenticado" }
 */
router.get("/me", autenticar, authController.me);

module.exports = router;
