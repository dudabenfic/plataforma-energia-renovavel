jest.mock("../src/config/supabase", () =>
  require("./helpers/supabaseMock").criarSupabaseMock()
);

const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const supabase = require("../src/config/supabase");
const app = require("../src/app");
const { criarDadosIniciais, SENHA_TESTE } = require("./helpers/dados");
const { bearer } = require("./helpers/auth");

beforeEach(() => supabase.banco.reiniciar(criarDadosIniciais()));

describe("POST /api/auth/register", () => {
  test("cadastra usuário com senha criptografada e perfil pesquisador", async () => {
    const resposta = await request(app).post("/api/auth/register").send({
      nome: "Nova Usuária",
      email: "  NOVA@Teste.com ",
      senha: "segura123",
      perfil: "admin"
    });

    expect(resposta.statusCode).toBe(201);
    expect(resposta.body.usuario).toMatchObject({
      nome: "Nova Usuária",
      email: "nova@teste.com",
      perfil: "pesquisador"
    });
    expect(resposta.body.usuario).not.toHaveProperty("senha_hash");

    const salvo = supabase.banco.tabela("usuarios").find((u) => u.email === "nova@teste.com");
    expect(salvo.senha_hash).not.toBe("segura123");
    expect(await bcrypt.compare("segura123", salvo.senha_hash)).toBe(true);
  });

  test("rejeita e-mail duplicado", async () => {
    const resposta = await request(app).post("/api/auth/register").send({
      nome: "Outra",
      email: "pesquisa@teste.com",
      senha: "segura123"
    });

    expect(resposta.statusCode).toBe(409);
  });

  test.each([
    [{ email: "a@a.com", senha: "123456" }, "obrigatórios"],
    [{ nome: "A", email: "invalido", senha: "123456" }, "E-mail inválido"],
    [{ nome: "A", email: "a@a.com", senha: "123" }, "6 caracteres"],
    [{ nome: "A", email: "a@a.com", senha: 123456 }, "obrigatórios"]
  ])("valida os dados enviados (%#)", async (corpo, mensagem) => {
    const resposta = await request(app).post("/api/auth/register").send(corpo);

    expect(resposta.statusCode).toBe(400);
    expect(resposta.body.erro).toContain(mensagem);
  });
});

describe("POST /api/auth/login", () => {
  test("retorna token JWT assinado com sub do usuário", async () => {
    const resposta = await request(app).post("/api/auth/login").send({
      email: "PESQUISA@teste.com",
      senha: SENHA_TESTE
    });

    expect(resposta.statusCode).toBe(200);
    expect(resposta.body.usuario).toEqual({
      id: 2,
      nome: "Pesquisadora",
      email: "pesquisa@teste.com",
      perfil: "pesquisador"
    });

    const payload = jwt.verify(resposta.body.token, process.env.JWT_SECRET);
    expect(payload.sub).toBe("2");
    expect(payload.exp).toBeGreaterThan(payload.iat);
  });

  test("senha incorreta retorna 401", async () => {
    const resposta = await request(app).post("/api/auth/login").send({
      email: "pesquisa@teste.com",
      senha: "errada"
    });

    expect(resposta.statusCode).toBe(401);
    expect(resposta.body.erro).toBe("E-mail ou senha inválidos.");
  });

  test("e-mail inexistente retorna a mesma mensagem", async () => {
    const resposta = await request(app).post("/api/auth/login").send({
      email: "naoexiste@teste.com",
      senha: SENHA_TESTE
    });

    expect(resposta.statusCode).toBe(401);
    expect(resposta.body.erro).toBe("E-mail ou senha inválidos.");
  });

  test("usuário inativo retorna 403", async () => {
    const resposta = await request(app).post("/api/auth/login").send({
      email: "inativo@teste.com",
      senha: SENHA_TESTE
    });

    expect(resposta.statusCode).toBe(403);
  });

  test("campos obrigatórios", async () => {
    const resposta = await request(app).post("/api/auth/login").send({});

    expect(resposta.statusCode).toBe(400);
  });

  test("JSON malformado retorna 400", async () => {
    const resposta = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send("{invalido");

    expect(resposta.statusCode).toBe(400);
  });
});

describe("GET /api/auth/me e middleware JWT", () => {
  test("retorna o usuário autenticado sem senha", async () => {
    const resposta = await request(app)
      .get("/api/auth/me")
      .set("Authorization", bearer("pesquisador"));

    expect(resposta.statusCode).toBe(200);
    expect(resposta.body.usuario.id).toBe(2);
    expect(resposta.body.usuario).not.toHaveProperty("senha_hash");
  });

  test("sem token retorna 401", async () => {
    const resposta = await request(app).get("/api/auth/me");

    expect(resposta.statusCode).toBe(401);
    expect(resposta.body.erro).toBe("Token de autenticação não informado.");
  });

  test("formato diferente de Bearer retorna 401", async () => {
    const resposta = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Token abc");

    expect(resposta.statusCode).toBe(401);
    expect(resposta.body.erro).toBe("Formato do token inválido.");
  });

  test("token com assinatura inválida retorna 401", async () => {
    const token = jwt.sign({ sub: "2" }, "outro-segredo");
    const resposta = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(resposta.statusCode).toBe(401);
  });

  test("token expirado retorna 401", async () => {
    const token = jwt.sign({ sub: "2" }, process.env.JWT_SECRET, { expiresIn: -10 });
    const resposta = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(resposta.statusCode).toBe(401);
    expect(resposta.body.erro).toBe("Token inválido ou expirado.");
  });

  test("token com sub inválido retorna 401", async () => {
    const token = jwt.sign({ sub: "abc" }, process.env.JWT_SECRET);
    const resposta = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(resposta.statusCode).toBe(401);
  });

  test("usuário removido retorna 401 e inativo retorna 403", async () => {
    const tokenRemovido = jwt.sign({ sub: "99" }, process.env.JWT_SECRET);
    const removido = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${tokenRemovido}`);
    expect(removido.statusCode).toBe(401);

    const inativo = await request(app)
      .get("/api/auth/me")
      .set("Authorization", bearer("inativo"));
    expect(inativo.statusCode).toBe(403);
  });

  test("rotas da API exigem autenticação", async () => {
    for (const rota of ["/api/municipios", "/api/criterios", "/api/simulacoes", "/api/indicadores"]) {
      const resposta = await request(app).get(rota);
      expect(resposta.statusCode).toBe(401);
    }
  });
});
