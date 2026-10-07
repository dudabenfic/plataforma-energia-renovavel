import { API_TESTES } from "../api-testes.js";

const IBGE = "servicodados.ibge.gov.br";

beforeEach(() => {
  // Proteção: qualquer chamada a uma API da plataforma que não seja a de
  // testes (banco em memória) é bloqueada antes de sair do navegador.
  cy.intercept({ url: "**/api/**" }, (req) => {
    if (req.url.includes(IBGE)) return;

    if (!req.url.startsWith(API_TESTES)) {
      req.reply({ statusCode: 418, body: { erro: "Bloqueado pelos testes" } });
      throw new Error(`Chamada bloqueada para fora da API de testes: ${req.url}`);
    }
  });

  // A busca no IBGE do cadastro não faz parte destes testes: resposta vazia,
  // para os testes não dependerem da internet.
  cy.intercept({ hostname: IBGE }, { statusCode: 200, body: [] });
});
