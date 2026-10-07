import { defineConfig } from "cypress";
import { API_TESTES } from "./cypress/api-testes.js";

// Testes de sistema (ponta a ponta), sempre contra a API de testes com
// banco em memória (backend: npm run start:e2e, porta 3101).
// Frontend: VITE_API_URL=http://127.0.0.1:3101 npm run build && npm run preview
export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:4173",
    video: false,
    defaultCommandTimeout: 10000,
    setupNodeEvents(on) {
      // Garante que os testes nunca rodem contra a API real.
      on("before:run", async () => {
        const resposta = await fetch(`${API_TESTES}/`).catch(() => null);

        if (!resposta?.ok) {
          throw new Error(
            `API de testes não encontrada em ${API_TESTES}. Rode "npm run start:e2e" no backend.`
          );
        }
      });
    }
  }
});
