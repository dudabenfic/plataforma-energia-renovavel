// Fluxo do documento (Cap. 10 - teste de sistema):
// usuário cadastra município -> executa TOPSIS -> vê ranking.
function campo(rotulo) {
  return cy.contains("label", rotulo).find("input");
}

function entrar() {
  cy.visit("/");
  campo("E-mail").type("pesquisa@teste.com");
  campo("Senha").type("senha123");
  cy.get("form").submit();
  cy.contains("h2", "Dashboard").should("be.visible");
}

const NOVO_MUNICIPIO = {
  nome: `Município E2E ${Date.now()}`,
  valores: { C1: 18, C2: 0.5, C3: 800, C4: 0.8, C5: 5, C6: 20, C7: 3 }
};

describe("Fluxo principal", () => {
  beforeEach(entrar);

  it("cadastra um município com os 7 indicadores", () => {
    cy.contains("nav button", "Municípios").click();
    cy.contains("button", "Novo município").click();

    campo("Nome *").type(NOVO_MUNICIPIO.nome);
    campo("UF *").type("SE");
    campo("População").type("60000");
    campo("Latitude").type("-10.9");
    campo("Longitude").type("-37.07");

    Object.entries(NOVO_MUNICIPIO.valores).forEach(([codigo, valor]) => {
      cy.contains("label", `${codigo} ·`).find("input").type(String(valor));
    });

    cy.contains("button", "Salvar").click();

    cy.contains(`Município "${NOVO_MUNICIPIO.nome}" salvo com sucesso.`).should("be.visible");
    cy.contains("td", NOVO_MUNICIPIO.nome).should("be.visible");
  });

  it("executa o TOPSIS e exibe o ranking com Ci", () => {
    cy.contains("nav button", "Simulação").click();
    cy.contains("Soma dos pesos").should("contain", "100.0%");

    cy.contains("button", "Executar TOPSIS").click();

    cy.contains("h3", /Resultado — simulação #\d+/).should("be.visible");
    cy.get("#resultado table tbody tr").should("have.length.at.least", 3);
    cy.get("#resultado table tbody tr")
      .first()
      .should("contain", "1º")
      .and("contain", "Município B")
      .and("contain", "1.0000");
    cy.contains("button", "Exportar PDF").should("be.visible");
    cy.contains("button", "Exportar CSV").should("be.visible");
  });

  it("bloqueia a execução quando a soma dos pesos não é 100%", () => {
    cy.contains("nav button", "Simulação").click();
    cy.get('input[aria-label="Peso de C1 em porcentagem"]').clear().type("90");

    cy.contains("ajuste para 100%").should("be.visible");
    cy.contains("button", "Executar TOPSIS").should("be.disabled");
  });

  it("mostra a simulação no histórico com usuário e ranking", () => {
    cy.contains("nav button", "Histórico").click();
    cy.get("table tbody tr").first().should("contain", "Pesquisadora");
    cy.get("table tbody tr").first().contains("button", "Abrir").click();

    cy.contains("h3", /Simulação #\d+/).should("be.visible");
    cy.contains("h4", "Ranking").should("be.visible");
  });
});
