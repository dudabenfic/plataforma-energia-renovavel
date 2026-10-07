jest.mock("../src/config/supabase", () =>
  require("./helpers/supabaseMock").criarSupabaseMock()
);

const request = require("supertest");
const supabase = require("../src/config/supabase");
const app = require("../src/app");
const { criarDadosIniciais } = require("./helpers/dados");
const { bearer } = require("./helpers/auth");

beforeEach(() => supabase.banco.reiniciar(criarDadosIniciais()));

function api(metodo, url, perfil = "pesquisador") {
  return request(app)[metodo](url).set("Authorization", bearer(perfil));
}

describe("Municípios (RF01)", () => {
  test("lista em ordem alfabética", async () => {
    const resposta = await api("get", "/api/municipios");

    expect(resposta.statusCode).toBe(200);
    expect(resposta.body.municipios.map((m) => m.nome)).toEqual([
      "Município A",
      "Município B",
      "Município C"
    ]);
  });

  test("busca por ID, 404 e ID inválido", async () => {
    expect((await api("get", "/api/municipios/1")).body.municipio.nome).toBe("Município A");
    expect((await api("get", "/api/municipios/99")).statusCode).toBe(404);
    expect((await api("get", "/api/municipios/x")).statusCode).toBe(400);
  });

  test("cadastra com coordenadas em EWKT (SRID 4326)", async () => {
    const resposta = await api("post", "/api/municipios").send({
      nome: " Município D ",
      uf: "ba",
      populacao: "50000",
      idh: "0,65",
      latitude: -12.5,
      longitude: -39.1
    });

    expect(resposta.statusCode).toBe(201);
    expect(resposta.body.municipio).toMatchObject({
      nome: "Município D",
      uf: "BA",
      populacao: 50000,
      idh: 0.65,
      latitude: -12.5,
      longitude: -39.1,
      coordenadas: "SRID=4326;POINT(-39.1 -12.5)"
    });
  });

  test.each([
    [{ uf: "BA" }, "Nome"],
    [{ nome: "X" }, "UF"],
    [{ nome: "X", uf: "BAH" }, "UF"],
    [{ nome: "X", uf: "BA", populacao: -1 }, "População"],
    [{ nome: "X", uf: "BA", populacao: 1.5 }, "População"],
    [{ nome: "X", uf: "BA", idh: "abc" }, "IDH"],
    [{ nome: "X", uf: "BA", idh: 2 }, "IDH"],
    [{ nome: "X", uf: "BA", latitude: 10 }, "juntas"],
    [{ nome: "X", uf: "BA", latitude: 100, longitude: 0 }, "Latitude"]
  ])("valida cadastro (%#)", async (corpo, mensagem) => {
    const resposta = await api("post", "/api/municipios").send(corpo);

    expect(resposta.statusCode).toBe(400);
    expect(resposta.body.erro).toContain(mensagem);
  });

  test("atualiza apenas os campos enviados", async () => {
    const resposta = await api("put", "/api/municipios/1").send({ populacao: 120000 });

    expect(resposta.statusCode).toBe(200);
    expect(resposta.body.municipio).toMatchObject({ nome: "Município A", populacao: 120000, latitude: -12.9711 });
  });

  test("atualização de município inexistente retorna 404", async () => {
    expect((await api("put", "/api/municipios/99").send({ nome: "X" })).statusCode).toBe(404);
  });

  test("gestor não pode cadastrar; exclusão é restrita ao admin", async () => {
    expect((await api("post", "/api/municipios", "gestor").send({ nome: "X", uf: "BA" })).statusCode).toBe(403);
    expect((await api("delete", "/api/municipios/1", "pesquisador")).statusCode).toBe(403);

    const resposta = await api("delete", "/api/municipios/1", "admin");
    expect(resposta.statusCode).toBe(200);
    expect((await api("delete", "/api/municipios/1", "admin")).statusCode).toBe(404);
  });
});

describe("Critérios (RF02/RF03)", () => {
  test("lista os 7 critérios", async () => {
    const resposta = await api("get", "/api/criterios");

    expect(resposta.body.criterios.map((c) => c.codigo)).toEqual(["C1", "C2", "C3", "C4", "C5", "C6", "C7"]);
  });

  test("filtra apenas ativos", async () => {
    supabase.banco.tabela("criterios")[6].ativo = false;

    const resposta = await api("get", "/api/criterios?ativos=true");

    expect(resposta.body.criterios).toHaveLength(6);
  });

  test("busca por ID e 404", async () => {
    expect((await api("get", "/api/criterios/4")).body.criterio.codigo).toBe("C4");
    expect((await api("get", "/api/criterios/99")).statusCode).toBe(404);
  });

  test("admin cadastra critério; código duplicado é rejeitado", async () => {
    const novo = await api("post", "/api/criterios", "admin").send({
      codigo: "c8",
      nome: "Novo",
      tipo: "beneficio"
    });

    expect(novo.statusCode).toBe(201);
    expect(novo.body.criterio).toMatchObject({ codigo: "C8", peso: 0 });

    const duplicado = await api("post", "/api/criterios", "admin").send({ codigo: "C1", nome: "X", tipo: "custo" });
    expect(duplicado.statusCode).toBe(409);
  });

  test("pesquisador não cadastra critério", async () => {
    const resposta = await api("post", "/api/criterios").send({ nome: "X", tipo: "custo" });

    expect(resposta.statusCode).toBe(403);
  });

  test.each([
    [{ tipo: "custo" }, "Nome"],
    [{ nome: "X", tipo: "outro" }, "Tipo"],
    [{ nome: "X", tipo: "custo", peso: 2 }, "Peso"]
  ])("valida critério (%#)", async (corpo, mensagem) => {
    const resposta = await api("post", "/api/criterios", "admin").send(corpo);

    expect(resposta.statusCode).toBe(400);
    expect(resposta.body.erro).toContain(mensagem);
  });

  test("pesquisador atualiza tipo e descrição", async () => {
    const resposta = await api("put", "/api/criterios/6").send({ descricao: "Nova descrição", fonte: "IBGE" });

    expect(resposta.statusCode).toBe(200);
    expect(resposta.body.criterio.descricao).toBe("Nova descrição");
    expect((await api("put", "/api/criterios/99").send({ nome: "X" })).statusCode).toBe(404);
  });

  test("salva pesos padrão validando a soma", async () => {
    const valido = await api("put", "/api/criterios/pesos").send({
      pesos: [
        { criterio_id: 5, peso: 0.1 },
        { criterio_id: 6, peso: 0.05 },
        { criterio_id: 7, peso: 0.05 }
      ]
    });

    expect(valido.statusCode).toBe(200);
    expect(valido.body.criterios.map((c) => c.peso)).toEqual([0.2, 0.2, 0.15, 0.25, 0.1, 0.05, 0.05]);

    const invalido = await api("put", "/api/criterios/pesos").send({ pesos: [{ criterio_id: 1, peso: 0.9 }] });
    expect(invalido.statusCode).toBe(400);

    expect((await api("put", "/api/criterios/pesos").send({})).statusCode).toBe(400);
    expect(
      (await api("put", "/api/criterios/pesos").send({ pesos: [{ criterio_id: 99, peso: 0 }] })).statusCode
    ).toBe(400);
  });

  test("desativação preserva o registro (somente admin)", async () => {
    expect((await api("delete", "/api/criterios/7")).statusCode).toBe(403);

    const resposta = await api("delete", "/api/criterios/7", "admin");

    expect(resposta.statusCode).toBe(200);
    expect(supabase.banco.tabela("criterios").find((c) => c.id === 7).ativo).toBe(false);
  });
});

describe("Indicadores / matriz de decisão (RF02)", () => {
  test("retorna a matriz do ano mais recente", async () => {
    const resposta = await api("get", "/api/indicadores");

    expect(resposta.statusCode).toBe(200);
    expect(resposta.body.anos).toEqual([2026]);
    expect(resposta.body.ano_referencia).toBe(2026);
    expect(resposta.body.criterios).toHaveLength(7);

    const municipioB = resposta.body.municipios.find((m) => m.id === 2);
    expect(municipioB.valores).toEqual({ 1: 5, 2: 2.1, 3: 1850, 4: 0.62, 5: 5.8, 6: 7, 7: 8 });
  });

  test("ano sem dados retorna municípios sem valores; ano inválido é rejeitado", async () => {
    const resposta = await api("get", "/api/indicadores?ano=2020");

    expect(resposta.body.municipios[0].valores).toEqual({});
    expect((await api("get", "/api/indicadores?ano=abc")).statusCode).toBe(400);
  });

  test("matriz vazia", async () => {
    supabase.banco.tabelas.matriz_decisao = [];

    const resposta = await api("get", "/api/indicadores");

    expect(resposta.body.ano_referencia).toBeNull();
  });

  test("lista os indicadores de um município", async () => {
    const resposta = await api("get", "/api/municipios/1/indicadores");

    expect(resposta.body.indicadores).toHaveLength(7);
    expect((await api("get", "/api/municipios/99/indicadores")).statusCode).toBe(404);
  });

  test("grava indicadores por código e por criterio_id (upsert)", async () => {
    const resposta = await api("put", "/api/municipios/1/indicadores").send({
      ano_referencia: 2026,
      valores: [
        { codigo: "c1", valor: "12,5" },
        { criterio_id: 7, valor: 6 }
      ]
    });

    expect(resposta.statusCode).toBe(200);

    const linhas = supabase.banco.tabela("matriz_decisao").filter((r) => r.municipio_id === 1);
    expect(linhas).toHaveLength(7);
    expect(linhas.find((r) => r.criterio_id === 1).valor).toBe(12.5);
    expect(linhas.find((r) => r.criterio_id === 7).valor).toBe(6);
  });

  test.each([
    [{ valores: [{ codigo: "C1", valor: 1 }] }, "Ano"],
    [{ ano_referencia: 2026 }, "lista"],
    [{ ano_referencia: 2026, valores: [{ codigo: "C9", valor: 1 }] }, "não encontrado"],
    [{ ano_referencia: 2026, valores: [{ codigo: "C1", valor: "x" }] }, "Valor inválido"]
  ])("valida gravação de indicadores (%#)", async (corpo, mensagem) => {
    const resposta = await api("put", "/api/municipios/1/indicadores").send(corpo);

    expect(resposta.statusCode).toBe(400);
    expect(resposta.body.erro).toContain(mensagem);
  });
});

describe("Usuários e perfis (RF08)", () => {
  test("somente admin lista usuários, sem senha", async () => {
    expect((await api("get", "/api/usuarios")).statusCode).toBe(403);

    const resposta = await api("get", "/api/usuarios", "admin");

    expect(resposta.statusCode).toBe(200);
    expect(resposta.body.usuarios).toHaveLength(4);
    resposta.body.usuarios.forEach((u) => expect(u).not.toHaveProperty("senha_hash"));
  });

  test("admin altera perfil e status", async () => {
    const resposta = await api("patch", "/api/usuarios/2", "admin").send({ perfil: "gestor", ativo: false });

    expect(resposta.statusCode).toBe(200);
    expect(resposta.body.usuario).toMatchObject({ perfil: "gestor", ativo: false });
  });

  test.each([
    [2, { perfil: "superuser" }, 400],
    [2, { ativo: "sim" }, 400],
    [2, {}, 400],
    [1, { perfil: "gestor" }, 400],
    [99, { perfil: "gestor" }, 404]
  ])("valida alteração do usuário %s", async (id, corpo, status) => {
    const resposta = await api("patch", `/api/usuarios/${id}`, "admin").send(corpo);

    expect(resposta.statusCode).toBe(status);
  });
});
