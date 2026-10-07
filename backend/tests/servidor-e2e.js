// Servidor da API com banco em memória (dados de demonstração) para os
// testes ponta a ponta do frontend. Não acessa o Supabase.
process.env.JWT_SECRET = process.env.JWT_SECRET || "segredo-dos-testes-e2e";
process.env.SUPABASE_URL = "http://localhost";
process.env.SUPABASE_KEY = "chave-de-teste";

const { criarSupabaseMock } = require("./helpers/supabaseMock");
const { criarDadosIniciais } = require("./helpers/dados");

const supabase = criarSupabaseMock();
supabase.banco.reiniciar(criarDadosIniciais());

require.cache[require.resolve("../src/config/supabase")] = {
  id: "supabase-e2e",
  loaded: true,
  exports: supabase
};

const app = require("../src/app");

// Porta exclusiva dos testes: nunca a 3001 do backend de desenvolvimento,
// que usa o banco real.
const PORTA = 3101;

const servidor = app.listen(PORTA, "127.0.0.1", () => {
  console.log(`API de testes (banco em memória) em http://127.0.0.1:${PORTA}`);
});

servidor.on("error", (error) => {
  console.error(`Não foi possível iniciar a API de testes na porta ${PORTA}: ${error.message}`);
  process.exit(1);
});
