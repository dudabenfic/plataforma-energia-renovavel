jest.mock("../src/config/supabase", () =>
  require("./helpers/supabaseMock").criarSupabaseMock()
);

const request = require("supertest");
const supabase = require("../src/config/supabase");
const app = require("../src/app");
const { criarDadosIniciais } = require("./helpers/dados");
const { bearer } = require("./helpers/auth");

beforeEach(() => supabase.banco.reiniciar(criarDadosIniciais()));

function executar(corpo = {}, perfil = "pesquisador") {
  return request(app)
    .post("/api/topsis/executar")
    .set("Authorization", bearer(perfil))
    .send(corpo);
}

describe("POST /api/topsis/executar", () => {
  test("exige autenticação", async () => {
    const resposta = await request(app).post("/api/topsis/executar").send({});

    expect(resposta.statusCode).toBe(401);
    expect(supabase.banco.tabela("simulacoes")).toHaveLength(1);
  });

  test("calcula com os 7 critérios e gera ranking B > A > C", async () => {
    const resposta = await executar();

    expect(resposta.statusCode).toBe(200);
    expect(resposta.body.sucesso).toBe(true);
    expect(resposta.body.criterios).toHaveLength(7);
    expect(resposta.body.pesos).toEqual([0.2, 0.2, 0.15, 0.25, 0.2, 0, 0]);
    expect(resposta.body.ano_referencia).toBe(2026);
    expect(resposta.body.ranking.map((r) => r.municipio)).toEqual([
      "Município B",
      "Município A",
      "Município C"
    ]);
    expect(resposta.body.ranking[1].ci).toBeCloseTo(0.33606, 4);
  });

  test("registra a simulação com o usuário autenticado e os resultados", async () => {
    const resposta = await executar({}, "gestor");
    const simulacao = supabase.banco
      .tabela("simulacoes")
      .find((s) => s.id === resposta.body.simulacao.id);

    expect(simulacao.usuario_id).toBe(3);
    expect(simulacao.status).toBe("concluida");
    expect(simulacao.parametros.criterios.map((c) => c.codigo)).toEqual([
      "C1", "C2", "C3", "C4", "C5", "C6", "C7"
    ]);

    const resultados = supabase.banco
      .tabela("resultados_ranking")
      .filter((r) => r.simulacao_id === simulacao.id);

    expect(resultados).toHaveLength(3);
    expect(resultados.find((r) => r.posicao === 1).municipio_id).toBe(2);
  });

  test("aceita pesos personalizados como lista de números", async () => {
    const resposta = await executar({ pesos: [0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.1] });

    expect(resposta.statusCode).toBe(200);
    expect(resposta.body.ranking[0].municipio).toBe("Município B");
  });

  test("aceita pesos por criterio_id", async () => {
    const resposta = await executar({
      pesos: [
        { criterio_id: 1, peso: 0.1 },
        { criterio_id: 6, peso: 0.1 }
      ]
    });

    expect(resposta.statusCode).toBe(200);
    expect(resposta.body.pesos).toEqual([0.1, 0.2, 0.15, 0.25, 0.2, 0.1, 0]);
  });

  test.each([
    [{ pesos: [0.5, 0.5, 0.5, 0, 0, 0, 0] }, "soma dos pesos"],
    [{ pesos: [0.2, 0.2, 0.15, 0.25, 0.2] }, "Informe 7 pesos"],
    [{ pesos: [1.5, -0.5, 0, 0, 0, 0, 0] }, "entre 0 e 1"],
    [{ pesos: "0.2" }, "lista"],
    [{ pesos: [{ criterio_id: 99, peso: 1 }] }, "não encontrado"],
    [{ municipio_ids: "1" }, "municipio_ids"],
    [{ ano_referencia: 1500 }, "Ano"]
  ])("valida a entrada (%#)", async (corpo, mensagem) => {
    const resposta = await executar(corpo);

    expect(resposta.statusCode).toBe(400);
    expect(resposta.body.erro).toContain(mensagem);
  });

  test("permite selecionar os municípios analisados", async () => {
    const resposta = await executar({ municipio_ids: [1, 3] });

    expect(resposta.body.ranking.map((r) => r.municipio)).toEqual([
      "Município A",
      "Município C"
    ]);
  });

  test("exige ao menos 2 municípios", async () => {
    const resposta = await executar({ municipio_ids: [1] });

    expect(resposta.statusCode).toBe(400);
  });

  test("ignora municípios com indicador faltando em critério com peso", async () => {
    supabase.banco.tabelas.matriz_decisao = supabase.banco
      .tabela("matriz_decisao")
      .filter((r) => !(r.municipio_id === 3 && r.criterio_id === 1));

    const resposta = await executar();

    expect(resposta.statusCode).toBe(200);
    expect(resposta.body.ranking).toHaveLength(2);
    expect(resposta.body.municipiosIgnorados[0]).toMatchObject({
      municipio_id: 3,
      criteriosSemValor: ["C1"]
    });
  });

  test("falta de indicador em critério com peso 0 não exclui o município", async () => {
    supabase.banco.tabelas.matriz_decisao = supabase.banco
      .tabela("matriz_decisao")
      .filter((r) => !(r.municipio_id === 3 && r.criterio_id === 7));

    const resposta = await executar();

    expect(resposta.body.ranking).toHaveLength(3);
  });

  test("usa apenas critérios ativos", async () => {
    supabase.banco.tabela("criterios").find((c) => c.id === 7).ativo = false;

    const resposta = await executar();

    expect(resposta.body.criterios).toHaveLength(6);
  });

  test("sem indicadores retorna 400", async () => {
    supabase.banco.tabelas.matriz_decisao = [];

    const resposta = await executar();

    expect(resposta.statusCode).toBe(400);
  });

  test("sem critérios ativos retorna 400", async () => {
    supabase.banco.tabelas.criterios = [];

    const resposta = await executar();

    expect(resposta.statusCode).toBe(400);
  });

  test("marca a simulação como erro se falhar ao gravar o ranking", async () => {
    supabase.banco.falharEm("resultados_ranking", "insert");

    const resposta = await executar();
    const ultima = supabase.banco.tabela("simulacoes").at(-1);

    expect(resposta.statusCode).toBe(500);
    expect(ultima.status).toBe("erro");
  });

  test("RNF01: 500 municípios com paginação da matriz em menos de 3 s", async () => {
    const municipios = [];
    const matriz = [];

    for (let i = 1; i <= 500; i++) {
      municipios.push({ id: i, nome: `Município ${i}`, uf: "BA" });
      for (let c = 1; c <= 7; c++) {
        matriz.push({ id: matriz.length + 1, municipio_id: i, criterio_id: c, valor: ((i * c) % 50) + 1, ano_referencia: 2026 });
      }
    }

    supabase.banco.tabelas.municipios = municipios;
    supabase.banco.tabelas.matriz_decisao = matriz;

    const inicio = Date.now();
    const resposta = await executar();

    expect(resposta.statusCode).toBe(200);
    expect(resposta.body.ranking).toHaveLength(500);
    expect(Date.now() - inicio).toBeLessThan(3000);
  });
});
