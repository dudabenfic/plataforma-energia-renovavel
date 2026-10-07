jest.mock("../src/config/supabase", () =>
  require("./helpers/supabaseMock").criarSupabaseMock()
);

const request = require("supertest");
const supabase = require("../src/config/supabase");
const app = require("../src/app");
const { criarDadosIniciais } = require("./helpers/dados");
const { bearer } = require("./helpers/auth");

beforeEach(() => supabase.banco.reiniciar(criarDadosIniciais()));

function importar(conteudo, perfil = "pesquisador") {
  return request(app)
    .post("/api/importar-csv")
    .set("Authorization", bearer(perfil))
    .attach("arquivo", Buffer.from(conteudo), "dados.csv");
}

const CABECALHO = "nome,uf,ano,populacao,idh,latitude,longitude,C1,C2,C3,C4,C5,C6,C7";

describe("POST /api/importar-csv (RF09)", () => {
  test("importa novo município com os 7 critérios por código", async () => {
    const resposta = await importar(
      [CABECALHO, "Município D,BA,2026,50000,0.65,-12.5,-39.1,10,1.2,1200,0.7,5.5,12,5"].join("\n")
    );

    expect(resposta.statusCode).toBe(200);
    expect(resposta.body.resumo).toMatchObject({
      linhas: 1,
      municipiosCriados: 1,
      municipiosAtualizados: 0,
      indicadoresGravados: 7,
      criteriosReconhecidos: ["C1", "C2", "C3", "C4", "C5", "C6", "C7"]
    });

    const novo = supabase.banco.tabela("municipios").find((m) => m.nome === "Município D");
    expect(novo.coordenadas).toBe("SRID=4326;POINT(-39.1 -12.5)");
    expect(supabase.banco.tabela("matriz_decisao").filter((r) => r.municipio_id === novo.id)).toHaveLength(7);
  });

  test("atualiza município existente (nome + UF) sem duplicar indicadores", async () => {
    const resposta = await importar(
      ["nome,uf,ano,populacao,C1,C7", "município a,ba,2026,110000,14,6"].join("\n")
    );

    expect(resposta.statusCode).toBe(200);
    expect(resposta.body.resumo.municipiosCriados).toBe(0);
    expect(resposta.body.resumo.municipiosAtualizados).toBe(1);
    expect(supabase.banco.tabela("municipios")).toHaveLength(3);
    expect(supabase.banco.tabela("municipios").find((m) => m.id === 1).populacao).toBe(110000);

    const valores = supabase.banco.tabela("matriz_decisao").filter((r) => r.municipio_id === 1);
    expect(valores).toHaveLength(7);
    expect(valores.find((r) => r.criterio_id === 7).valor).toBe(6);
  });

  test("aceita separador ; e vírgula decimal (padrão do Excel em português)", async () => {
    const resposta = await importar(
      ["nome;uf;ano;C4;C5", "Município E;SE;2025;0,81;5,4"].join("\n")
    );

    expect(resposta.statusCode).toBe(200);
    const valor = supabase.banco
      .tabela("matriz_decisao")
      .find((r) => r.criterio_id === 4 && r.ano_referencia === 2025);
    expect(valor.valor).toBe(0.81);
  });

  test("mantém compatibilidade com as colunas do modelo antigo", async () => {
    const resposta = await importar(
      [
        "nome,uf,populacao,idh,acesso_eletricidade,energia_solar,renda_per_capita,tarifa,irradiacao,ano",
        "Municipio Teste,BA,100000,0.700,15,0.8,980,0.75,5.2,2026"
      ].join("\n")
    );

    expect(resposta.statusCode).toBe(200);
    expect(resposta.body.resumo.criteriosReconhecidos).toEqual(["C1", "C2", "C3", "C4", "C5"]);
  });

  test("linhas repetidas para o mesmo município/critério/ano: vale a última", async () => {
    const resposta = await importar(
      ["nome,uf,ano,C1", "Município F,BA,2026,10", "Município F,BA,2026,20"].join("\n")
    );

    expect(resposta.body.resumo.municipiosCriados).toBe(1);
    expect(resposta.body.resumo.indicadoresGravados).toBe(1);
    expect(supabase.banco.tabela("matriz_decisao").at(-1).valor).toBe(20);
  });

  test("informa erros por linha e não importa nada", async () => {
    const resposta = await importar(
      [
        CABECALHO,
        "Município D,BA,2026,50000,0.65,-12.5,-39.1,10,1.2,1200,0.7,5.5,12,5",
        ",B,20x,-5,3,100,0,abc,1,1,1,1,1,-1"
      ].join("\n")
    );

    expect(resposta.statusCode).toBe(422);
    expect(resposta.body.erro).toContain("Nenhum dado foi importado");

    const campos = resposta.body.erros.map((e) => e.campo);
    expect(campos).toEqual(
      expect.arrayContaining(["nome", "uf", "ano", "populacao", "idh", "latitude/longitude", "c1", "c7"])
    );
    resposta.body.erros.forEach((e) => expect(e.linha).toBe(3));
    expect(supabase.banco.tabela("municipios")).toHaveLength(3);
  });

  test("avisa sobre colunas desconhecidas", async () => {
    const resposta = await importar(["nome,uf,ano,C1,observacao", "Município G,BA,2026,3,teste"].join("\n"));

    expect(resposta.statusCode).toBe(200);
    expect(resposta.body.avisos[0]).toContain("observacao");
  });

  test.each([
    ["", "vazio"],
    ["nome,uf,ano,C1", "vazio"],
    ["uf,ano,C1\nBA,2026,1", "nome"],
    ["nome,uf,C1\nX,BA,1", "ano"],
    ["nome,uf,ano,qualquer\nX,BA,2026,1", "Nenhuma coluna de critério"],
    ['nome,uf,ano,C1\n"X,BA,2026,1', "Não foi possível ler"]
  ])("valida a estrutura do arquivo (%#)", async (conteudo, mensagem) => {
    const resposta = await importar(conteudo);

    expect(resposta.statusCode).toBe(400);
    expect(resposta.body.erro).toContain(mensagem);
  });

  test("sem arquivo retorna 400", async () => {
    const resposta = await request(app)
      .post("/api/importar-csv")
      .set("Authorization", bearer());

    expect(resposta.statusCode).toBe(400);
    expect(resposta.body.erro).toBe("Nenhum arquivo CSV foi enviado.");
  });

  test("arquivo acima de 2 MB é rejeitado", async () => {
    const grande = "nome,uf,ano,C1\n" + "X,BA,2026,1\n".repeat(200000);
    const resposta = await importar(grande);

    expect(resposta.statusCode).toBe(400);
    expect(resposta.body.erro).toBe("Arquivo muito grande.");
  });

  test("gestor não pode importar; sem token retorna 401", async () => {
    expect((await importar("nome,uf,ano,C1\nX,BA,2026,1", "gestor")).statusCode).toBe(403);

    const semToken = await request(app)
      .post("/api/importar-csv")
      .attach("arquivo", Buffer.from("nome,uf,ano,C1\nX,BA,2026,1"), "a.csv");
    expect(semToken.statusCode).toBe(401);
  });
});
