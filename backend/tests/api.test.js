jest.mock("../src/config/supabase", () => ({
  from: jest.fn()
}));

const request = require("supertest");
const supabase = require("../src/config/supabase");
const app = require("../src/server");

beforeEach(() => {
  supabase.from.mockImplementation((tabela) => {

    // =========================
    // MUNICIPIOS
    // =========================
    if (tabela === "municipios") {
      const consulta = {
        select: jest.fn(() => consulta),

        order: jest.fn(() =>
          Promise.resolve({
            data: [
              { id: 1, nome: "Municipio A", uf: "BA" },
              { id: 2, nome: "Municipio B", uf: "BA" },
              { id: 3, nome: "Municipio C", uf: "BA" }
            ],
            error: null
          })
        ),

        eq: jest.fn(() => consulta),

        maybeSingle: jest.fn(() =>
          Promise.resolve({
            data: null,
            error: null
          })
        ),

        insert: jest.fn(() => consulta),

        update: jest.fn(() => consulta),

        single: jest.fn(() =>
          Promise.resolve({
            data: {
              id: 4,
              nome: "Municipio Teste",
              uf: "BA",
              populacao: 100000,
              idh: 0.7
            },
            error: null
          })
        )
      };

      return consulta;
    }

    // =========================
    // CRITERIOS
    // =========================
    if (tabela === "criterios") {
      const consulta = {
        select: jest.fn(() => consulta),

        order: jest.fn(() =>
          Promise.resolve({
            data: [
              {
                id: 1,
                nome: "Acesso",
                tipo: "custo",
                peso: 0.2
              },
              {
                id: 2,
                nome: "Solar",
                tipo: "beneficio",
                peso: 0.2
              },
              {
                id: 3,
                nome: "Renda",
                tipo: "beneficio",
                peso: 0.2
              },
              {
                id: 4,
                nome: "Tarifa",
                tipo: "custo",
                peso: 0.2
              },
              {
                id: 5,
                nome: "Irradiacao",
                tipo: "beneficio",
                peso: 0.2
              }
            ],
            error: null
          })
        )
      };

      return consulta;
    }

    // =========================
    // MATRIZ DE DECISAO
    // =========================
    if (tabela === "matriz_decisao") {
      const consulta = {
        select: jest.fn(() => consulta),

        order: jest.fn(() => consulta),

        upsert: jest.fn(() =>
          Promise.resolve({
            data: null,
            error: null
          })
        )
      };

      consulta.order
        .mockImplementationOnce(() => consulta)
        .mockImplementationOnce(() =>
          Promise.resolve({
            data: [
              {
                municipio_id: 1,
                criterio_id: 1,
                valor: 15
              },
              {
                municipio_id: 1,
                criterio_id: 2,
                valor: 0.8
              },
              {
                municipio_id: 1,
                criterio_id: 3,
                valor: 980
              },
              {
                municipio_id: 1,
                criterio_id: 4,
                valor: 0.75
              },
              {
                municipio_id: 1,
                criterio_id: 5,
                valor: 5.2
              },

              {
                municipio_id: 2,
                criterio_id: 1,
                valor: 5
              },
              {
                municipio_id: 2,
                criterio_id: 2,
                valor: 2.1
              },
              {
                municipio_id: 2,
                criterio_id: 3,
                valor: 1850
              },
              {
                municipio_id: 2,
                criterio_id: 4,
                valor: 0.62
              },
              {
                municipio_id: 2,
                criterio_id: 5,
                valor: 5.8
              },

              {
                municipio_id: 3,
                criterio_id: 1,
                valor: 22
              },
              {
                municipio_id: 3,
                criterio_id: 2,
                valor: 0.3
              },
              {
                municipio_id: 3,
                criterio_id: 3,
                valor: 650
              },
              {
                municipio_id: 3,
                criterio_id: 4,
                valor: 0.89
              },
              {
                municipio_id: 3,
                criterio_id: 5,
                valor: 4.9
              }
            ],
            error: null
          })
        );

      return consulta;
    }

    // =========================
    // SIMULACOES
    // =========================
    if (tabela === "simulacoes") {
      const consulta = {
        insert: jest.fn(() => consulta),

        select: jest.fn(() => consulta),

        order: jest.fn(() =>
          Promise.resolve({
            data: [
              {
                id: 1,
                data_execucao: "2026-10-07T10:00:00",
                status: "concluida"
              }
            ],
            error: null
          })
        ),

        single: jest.fn(() =>
          Promise.resolve({
            data: {
              id: 1
            },
            error: null
          })
        )
      };

      return consulta;
    }

    // =========================
    // RESULTADOS DO RANKING
    // =========================
    if (tabela === "resultados_ranking") {
      return {
        insert: jest.fn(() =>
          Promise.resolve({
            data: null,
            error: null
          })
        )
      };
    }

    return {};
  });
});

describe("API TOPSIS", () => {

  test("GET / deve retornar a mensagem da API", async () => {
    const resposta = await request(app)
      .get("/");

    expect(resposta.statusCode).toBe(200);
    expect(resposta.body).toHaveProperty("message");
  });

  test("GET /api/simulacoes deve retornar o histórico", async () => {
    const resposta = await request(app)
      .get("/api/simulacoes");

    expect(resposta.statusCode).toBe(200);
    expect(resposta.body).toHaveProperty("sucesso");
    expect(resposta.body).toHaveProperty("simulacoes");
    expect(Array.isArray(resposta.body.simulacoes)).toBe(true);
  });

  test("POST /api/topsis/executar deve executar o TOPSIS", async () => {
    const resposta = await request(app)
      .post("/api/topsis/executar")
      .send({});

    expect(resposta.statusCode).toBe(200);
    expect(resposta.body.sucesso).toBe(true);
    expect(resposta.body).toHaveProperty("ranking");
    expect(Array.isArray(resposta.body.ranking)).toBe(true);
    expect(resposta.body.ranking.length).toBe(3);
  });

  test("POST /api/importar-csv deve importar um CSV", async () => {
    const csv = [
      "nome,uf,populacao,idh,acesso_eletricidade,energia_solar,renda_per_capita,tarifa,irradiacao,ano",
      "Municipio Teste,BA,100000,0.700,15,0.8,980,0.75,5.2,2026"
    ].join("\n");

    const resposta = await request(app)
      .post("/api/importar-csv")
      .attach("arquivo", Buffer.from(csv), "teste.csv");

    expect(resposta.statusCode).toBe(200);
    expect(resposta.body.sucesso).toBe(true);
    expect(resposta.body).toHaveProperty("mensagem");
  });

});