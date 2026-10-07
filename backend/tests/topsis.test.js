const { topsis } = require("../src/services/topsis.service");
const {
  normalizar,
  ponderar,
  solucoesIdeais,
  distancia,
  coeficienteProximidade
} = require("../src/domain/topsis");

// Exemplo numérico do documento (C1–C5).
const MATRIZ_5 = [
  [15, 0.8, 980, 0.75, 5.2],
  [5, 2.1, 1850, 0.62, 5.8],
  [22, 0.3, 650, 0.89, 4.9]
];
const PESOS_5 = [0.20, 0.20, 0.15, 0.25, 0.20];
const TIPOS_5 = ["custo", "beneficio", "beneficio", "custo", "beneficio"];

// Mesmo exemplo com C6 e C7 (valores demonstrativos).
const MATRIZ_7 = [
  [15, 0.8, 980, 0.75, 5.2, 18, 4],
  [5, 2.1, 1850, 0.62, 5.8, 7, 8],
  [22, 0.3, 650, 0.89, 4.9, 25, 2]
];
const TIPOS_7 = [...TIPOS_5, "custo", "beneficio"];

describe("TOPSIS", () => {
  test("deve calcular o ranking esperado B > A > C", () => {
    const resultado = topsis(MATRIZ_5, PESOS_5, TIPOS_5);

    expect(resultado[0].posicao).toBe(1);
    expect(resultado[1].posicao).toBe(2);
    expect(resultado[2].posicao).toBe(3);

    expect(resultado[0].indice).toBe(1);
    expect(resultado[1].indice).toBe(0);
    expect(resultado[2].indice).toBe(2);
  });

  test("o coeficiente Ci deve estar entre 0 e 1", () => {
    const resultado = topsis(MATRIZ_5, PESOS_5, TIPOS_5);

    resultado.forEach((item) => {
      expect(item.ci).toBeGreaterThanOrEqual(0);
      expect(item.ci).toBeLessThanOrEqual(1);
    });
  });

  test("deve retornar uma posição para cada alternativa", () => {
    const matriz = [
      [10, 1, 1000, 0.70, 5],
      [20, 2, 1500, 0.80, 6],
      [30, 3, 2000, 0.90, 7]
    ];

    const resultado = topsis(matriz, PESOS_5, TIPOS_5);

    expect(resultado).toHaveLength(3);
    expect(resultado.map((item) => item.posicao)).toEqual([1, 2, 3]);
  });

  test("com os 7 critérios e pesos atuais (C6 = C7 = 0) mantém B > A > C", () => {
    const pesos = [0.20, 0.20, 0.15, 0.25, 0.20, 0, 0];
    const resultado = topsis(MATRIZ_7, pesos, TIPOS_7);

    expect(resultado.map((r) => r.indice)).toEqual([1, 0, 2]);
  });

  test("com C6 e C7 ponderados o ranking continua B > A > C", () => {
    const pesos = [0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.10];
    const resultado = topsis(MATRIZ_7, pesos, TIPOS_7);

    expect(resultado.map((r) => r.indice)).toEqual([1, 0, 2]);
  });

  test("Ci = D- / (D+ + D-) para cada alternativa", () => {
    const resultado = topsis(MATRIZ_5, PESOS_5, TIPOS_5);

    resultado.forEach((r) => {
      expect(r.ci).toBeCloseTo(
        r.distanciaNegativa / (r.distanciaPositiva + r.distanciaNegativa),
        10
      );
    });
  });

  test("valor calculado à mão para o município A (Ci ≈ 0.3361)", () => {
    const resultado = topsis(MATRIZ_5, PESOS_5, TIPOS_5);
    const municipioA = resultado.find((r) => r.indice === 0);

    expect(municipioA.ci).toBeCloseTo(0.33606, 4);
  });

  test("critério de custo: menor valor é melhor", () => {
    const resultado = topsis([[10], [20]], [1], ["custo"]);

    expect(resultado[0].indice).toBe(0);
    expect(resultado[0].ci).toBe(1);
    expect(resultado[1].ci).toBe(0);
  });

  test("critério de benefício: maior valor é melhor", () => {
    const resultado = topsis([[10], [20]], [1], ["beneficio"]);

    expect(resultado[0].indice).toBe(1);
  });

  test("alternativas idênticas recebem Ci = 0 sem divisão por zero", () => {
    const resultado = topsis([[1, 1], [1, 1]], [0.5, 0.5], ["custo", "beneficio"]);

    resultado.forEach((r) => expect(r.ci).toBe(0));
  });

  test("coluna com todos os valores zero não gera NaN", () => {
    const resultado = topsis([[0, 1], [0, 2]], [0.5, 0.5], ["custo", "beneficio"]);

    resultado.forEach((r) => expect(Number.isNaN(r.ci)).toBe(false));
  });

  test("rejeita entradas inconsistentes", () => {
    expect(() => topsis([], [], [])).toThrow();
    expect(() => topsis([[]], [], [])).toThrow();
    expect(() => topsis([[1, 2], [1]], [0.5, 0.5], ["custo", "custo"])).toThrow();
    expect(() => topsis([[1, 2]], [1], ["custo", "custo"])).toThrow();
    expect(() => topsis([[1]], [1], ["outro"])).toThrow();
  });

  test("RNF01: 500 alternativas x 7 critérios em menos de 3 segundos", () => {
    const matriz = Array.from({ length: 500 }, (_, i) =>
      Array.from({ length: 7 }, (_, j) => ((i + 1) * (j + 3)) % 97 + 1)
    );
    const pesos = [0.2, 0.2, 0.15, 0.25, 0.2, 0, 0];

    const inicio = Date.now();
    const resultado = topsis(matriz, pesos, TIPOS_7);
    const duracao = Date.now() - inicio;

    expect(resultado).toHaveLength(500);
    expect(duracao).toBeLessThan(3000);
  });
});

describe("Etapas do TOPSIS", () => {
  test("normalização vetorial preserva proporções", () => {
    const resultado = normalizar([3, 4]); // norma = 5

    expect(resultado[0]).toBeCloseTo(0.6);
    expect(resultado[1]).toBeCloseTo(0.8);
  });

  test("normalização retorna valores entre 0 e 1", () => {
    normalizar([15, 5, 22]).forEach((valor) => {
      expect(valor).toBeGreaterThanOrEqual(0);
      expect(valor).toBeLessThanOrEqual(1);
    });
  });

  test("ponderação multiplica cada coluna pelo seu peso", () => {
    expect(ponderar([[1, 1]], [0.3, 0.7])).toEqual([[0.3, 0.7]]);
  });

  test("soluções ideais respeitam o tipo do critério", () => {
    const { idealPositiva, idealNegativa } = solucoesIdeais(
      [[1, 1], [3, 3]],
      ["beneficio", "custo"]
    );

    expect(idealPositiva).toEqual([3, 1]);
    expect(idealNegativa).toEqual([1, 3]);
  });

  test("distância euclidiana e coeficiente", () => {
    expect(distancia([0, 0], [3, 4])).toBe(5);
    expect(coeficienteProximidade(1, 3)).toBe(0.75);
    expect(coeficienteProximidade(0, 0)).toBe(0);
  });
});
