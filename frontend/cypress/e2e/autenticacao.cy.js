// Usuários de teste definidos em backend/tests/helpers/dados.js.
const SENHA = "senha123";

function campo(rotulo) {
  return cy.contains("label", rotulo).find("input");
}

describe("Autenticação", () => {
  it("exige login para acessar a plataforma", () => {
    cy.visit("/#/simulacao");

    cy.contains("button", "Entrar").should("be.visible");
    cy.contains("Simulação TOPSIS").should("not.exist");
  });

  it("informa erro com senha incorreta", () => {
    cy.visit("/");
    campo("E-mail").type("pesquisa@teste.com");
    campo("Senha").type("senha-errada");
    cy.get("form").submit();

    cy.contains("E-mail ou senha inválidos.").should("be.visible");
  });

  it("cadastra um novo usuário e entra como pesquisador", () => {
    const email = `usuario.${Date.now()}@teste.com`;

    cy.visit("/");
    cy.contains("button", "Criar conta").click();
    campo("Nome").type("Usuária Cypress");
    campo("E-mail").type(email);
    cy.contains("label", /^Senha/).find("input").type(SENHA);
    campo("Confirmar senha").type(SENHA);
    cy.contains("button", "Cadastrar").click();

    cy.contains("h2", "Dashboard").should("be.visible");
    cy.contains("Usuária Cypress").should("be.visible");
    cy.contains("Pesquisador").should("be.visible");
  });

  it("sai da conta", () => {
    cy.visit("/");
    campo("E-mail").type("gestor@teste.com");
    campo("Senha").type(SENHA);
    cy.get("form").submit();

    cy.contains("button", "Sair").click();
    cy.contains("button", "Entrar").should("be.visible");
  });
});
