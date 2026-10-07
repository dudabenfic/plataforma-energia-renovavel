const express = require("express");
const multer = require("multer");
const importacaoController = require("../controllers/importacao.controller");
const { autorizar } = require("../middleware/auth.middleware");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }
});

/**
 * @swagger
 * /api/importar-csv:
 *   post:
 *     tags: [Importação]
 *     summary: Importa municípios e indicadores via CSV (admin, pesquisador)
 *     description: |
 *       Importa dados obtidos de fontes externas (IBGE, ANEEL, INPE).
 *       Separador "," ou ";". Colunas obrigatórias: `nome`, `uf`, `ano`.
 *       Colunas opcionais: `populacao`, `idh`, `latitude`, `longitude`.
 *       Indicadores: uma coluna por código de critério (`C1` a `C7`).
 *       Os nomes antigos (acesso_eletricidade, energia_solar, renda_per_capita,
 *       tarifa, irradiacao) continuam aceitos.
 *
 *       O arquivo inteiro é validado antes da gravação: se houver erros,
 *       nada é importado e a resposta lista os erros por linha.
 *
 *       Exemplo:
 *       ```
 *       nome,uf,ano,populacao,idh,latitude,longitude,C1,C2,C3,C4,C5,C6,C7
 *       Município A,BA,2026,100000,0.7,-12.9711,-38.5014,15,0.8,980,0.75,5.2,18,4
 *       ```
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [arquivo]
 *             properties:
 *               arquivo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Importação concluída
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sucesso: { type: boolean }
 *                 mensagem: { type: string }
 *                 resumo:
 *                   type: object
 *                   properties:
 *                     linhas: { type: integer }
 *                     municipiosCriados: { type: integer }
 *                     municipiosAtualizados: { type: integer }
 *                     indicadoresGravados: { type: integer }
 *                     criteriosReconhecidos: { type: array, items: { type: string } }
 *                 avisos: { type: array, items: { type: string } }
 *       400: { $ref: "#/components/responses/DadosInvalidos" }
 *       401: { $ref: "#/components/responses/NaoAutenticado" }
 *       403: { $ref: "#/components/responses/SemPermissao" }
 *       422:
 *         description: Erros de validação por linha (nada foi importado)
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Erro" }
 *             example:
 *               sucesso: false
 *               erro: "O CSV possui 1 erro(s). Nenhum dado foi importado."
 *               erros: [{ linha: 3, campo: "c4", mensagem: "Valor numérico inválido: \"abc\"." }]
 */
router.post(
  "/",
  autorizar("admin", "pesquisador"),
  upload.single("arquivo"),
  importacaoController.importarCsv
);

module.exports = router;
