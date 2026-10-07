const { env, validarAmbiente } = require("./config/env");
const app = require("./app");

if (require.main === module) {
  validarAmbiente();

  app.listen(env.PORT, () => {
    console.log(`Servidor rodando na porta ${env.PORT}`);
  });
}

module.exports = app;
