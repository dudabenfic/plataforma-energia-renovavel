jest.mock("../src/config/supabase", () =>
  require("./helpers/supabaseMock").criarSupabaseMock()
);

const request = require("supertest");
const supabase = require("../src/config/supabase");
const app = require("../src/app");
const { criarDadosIniciais } = require("./helpers/dados");
const { bearer } = require("./helpers/auth");

beforeEach(() => supabase.banco.reiniciar(criarDadosIniciais()));

function get(url, perfil = "pesquisador") {
  return request(app).get(url).set("Authorization", bearer(perfil));
}

async function novaSimulacao(perfil = "pesquisador") {
  const resposta = await request(app)
    .post("/api/topsis/executar")
    .set("Authorization", bearer(perfil))
    .send({});

  return resposta.body.simulacao.id;
}

describe("GET /api/simulacoes", () => {
  test("lista o histórico do mais recente para o mais antigo", async () => {
    await novaSimulacao();
    const resposta = await get("/api/simulacoes");

    expect(resposta.statusCode).toBe(200);
    expect(resposta.body.total).toBe(2);
    expect(resposta.body.simulacoes.map((s) => s.id)).toEqual([2, 1]);
  });

  test("inclui o usuário quando disponível (antigas ficam com null)", async () => {
    await novaSimulacao("gestor");
    const resposta = await get("/api/simulacoes");

    expect(resposta.body.simulacoes[0].usuario).toEqual({ id: 3, nome: "Gestor" });
    expect(resposta.body.simulacoes[1].usuario).toBeNull();
  });

  test("filtra pelas simulações do usuário logado", async () => {
    await novaSimulacao("gestor");
    await novaSimulacao("pesquisador");

    const resposta = await get("/api/simulacoes?minhas=true", "gestor");

    expect(resposta.body.simulacoes).toHaveLength(1);
    expect(resposta.body.simulacoes[0].usuario_id).toBe(3);
  });

  test("filtra por usuário, status e período", async () => {
    await novaSimulacao("gestor");

    expect((await get("/api/simulacoes?usuario_id=3")).body.total).toBe(1);
    expect((await get("/api/simulacoes?status=erro")).body.total).toBe(0);
    expect(
      (await get("/api/simulacoes?data_inicio=2026-10-01&data_fim=2026-10-05")).body.total
    ).toBe(1);
  });

  test("paginação com limite e deslocamento", async () => {
    await novaSimulacao();
    await novaSimulacao();

    const resposta = await get("/api/simulacoes?limite=1&deslocamento=1");

    expect(resposta.body.simulacoes).toHaveLength(1);
    expect(resposta.body.simulacoes[0].id).toBe(2);
    expect(resposta.body.total).toBe(3);
  });

  test.each([
    "/api/simulacoes?status=xyz",
    "/api/simulacoes?data_inicio=ontem",
    "/api/simulacoes?limite=0",
    "/api/simulacoes?usuario_id=abc"
  ])("valida filtros: %s", async (url) => {
    expect((await get(url)).statusCode).toBe(400);
  });
});

describe("GET /api/simulacoes/:id", () => {
  test("retorna simulação, parâmetros e ranking com município e UF", async () => {
    const id = await novaSimulacao();
    const resposta = await get(`/api/simulacoes/${id}`);

    expect(resposta.statusCode).toBe(200);
    expect(resposta.body.simulacao.parametros.pesos).toHaveLength(7);
    expect(resposta.body.simulacao.usuario).toEqual({ id: 2, nome: "Pesquisadora" });
    expect(resposta.body.ranking.map((r) => [r.posicao, r.municipio, r.uf])).toEqual([
      [1, "Município B", "BA"],
      [2, "Município A", "BA"],
      [3, "Município C", "BA"]
    ]);
  });

  test("simulação antiga (sem usuário) continua acessível", async () => {
    const resposta = await get("/api/simulacoes/1");

    expect(resposta.statusCode).toBe(200);
    expect(resposta.body.simulacao.usuario).toBeNull();
    expect(resposta.body.ranking[0].municipio).toBe("Município B");
  });

  test("404 para simulação inexistente e 400 para ID inválido", async () => {
    expect((await get("/api/simulacoes/999")).statusCode).toBe(404);
    expect((await get("/api/simulacoes/abc")).statusCode).toBe(400);
  });
});

describe("GET /api/relatorios/:id/csv", () => {
  test("exporta o ranking em CSV", async () => {
    const resposta = await get("/api/relatorios/1/csv");

    expect(resposta.statusCode).toBe(200);
    expect(resposta.headers["content-type"]).toContain("text/csv");
    expect(resposta.headers["content-disposition"]).toContain("relatorio-simulacao-1.csv");

    const linhas = resposta.text.replace("﻿", "").split("\n");
    expect(linhas[0]).toBe(
      "posicao,municipio,uf,coeficiente_ci,distancia_positiva,distancia_negativa,simulacao_id,data_execucao"
    );
    expect(linhas[1].startsWith("1,Município B,BA,1.000000")).toBe(true);
    expect(linhas).toHaveLength(4);
  });

  test("404 para simulação inexistente", async () => {
    expect((await get("/api/relatorios/999/csv")).statusCode).toBe(404);
  });
});
