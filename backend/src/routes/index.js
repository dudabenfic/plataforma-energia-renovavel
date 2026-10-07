const express = require("express");
const { autenticar } = require("../middleware/auth.middleware");

const router = express.Router();

// Rotas públicas: cadastro e login (o /me é protegido no próprio arquivo).
router.use("/auth", require("./auth.routes"));

// Demais rotas exigem token JWT válido.
router.use(autenticar);

router.use("/usuarios", require("./usuarios.routes"));
router.use("/municipios", require("./municipios.routes"));
router.use("/criterios", require("./criterios.routes"));
router.use("/indicadores", require("./indicadores.routes"));
router.use("/topsis", require("./topsis.routes"));
router.use("/simulacoes", require("./simulacoes.routes"));
router.use("/relatorios", require("./relatorios.routes"));
router.use("/importar-csv", require("./importacao.routes"));

module.exports = router;
