require("dotenv").config({ quiet: true });

const env = {
  PORT: Number(process.env.PORT) || 3001,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "8h",
  // Lista separada por vírgula. Vazio = qualquer origem.
  CORS_ORIGIN: process.env.CORS_ORIGIN || ""
};

const OBRIGATORIAS = ["SUPABASE_URL", "SUPABASE_KEY", "JWT_SECRET"];

function validarAmbiente() {
  const faltando = OBRIGATORIAS.filter((nome) => !env[nome]);

  if (faltando.length > 0) {
    throw new Error(
      `Variáveis de ambiente não configuradas: ${faltando.join(", ")}`
    );
  }
}

module.exports = { env, validarAmbiente };
