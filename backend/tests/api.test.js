jest.mock("../src/config/supabase", () =>
  require("./helpers/supabaseMock").criarSupabaseMock()
);

const request = require("supertest");
const supabase = require("../src/config/supabase");
const app = require("../src/server");
const { criarDadosIniciais } = require("./helpers/dados");
const { bearer } = require("./helpers/auth");

beforeEach(() => supabase.banco.reiniciar(criarDadosIniciais()));

describe("API", () => {
  test("GET / deve retornar a mensagem da API", async () => {
    const resposta = await request(app).get("/");

    expect(resposta.statusCode).toBe(200);
    expect(resposta.body).toHaveProperty("message");
  });

  test("rota inexistente retorna 404", async () => {
    const resposta = await request(app).get("/nao-existe");

    expect(resposta.statusCode).toBe(404);
    expect(resposta.body.sucesso).toBe(false);
  });

  test("documentação OpenAPI lista os endpoints principais", async () => {
    const resposta = await request(app).get("/api-docs.json");
    const caminhos = Object.keys(resposta.body.paths);

    expect(resposta.statusCode).toBe(200);
    expect(caminhos).toEqual(
      expect.arrayContaining([
        "/",
        "/api/auth/register",
        "/api/auth/login",
        "/api/auth/me",
        "/api/topsis/executar",
        "/api/simulacoes",
        "/api/simulacoes/{id}",
        "/api/importar-csv",
        "/api/municipios",
        "/api/criterios"
      ])
    );
    expect(resposta.body.components.securitySchemes.bearerAuth.scheme).toBe("bearer");
  });

  test("erros inesperados do banco retornam 500 sem detalhes internos", async () => {
    supabase.banco.falharEm("municipios", "select");

    const resposta = await request(app)
      .get("/api/municipios")
      .set("Authorization", bearer());

    expect(resposta.statusCode).toBe(500);
    expect(resposta.body.erro).toBe("Erro interno do servidor.");
  });

  test("erro de duplicidade do banco retorna 409", async () => {
    supabase.banco.falharEm("municipios", "insert", { code: "23505", message: "duplicate" });

    const resposta = await request(app)
      .post("/api/municipios")
      .set("Authorization", bearer())
      .send({ nome: "X", uf: "BA" });

    expect(resposta.statusCode).toBe(409);
  });
});
