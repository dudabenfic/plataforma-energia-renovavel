const { topsis } = require("../src/services/topsis.service");

describe("TOPSIS", () => {
  test("deve calcular o ranking esperado B > A > C", () => {
    const matriz = [
      [15, 0.8, 980, 0.75, 5.2],
      [5, 2.1, 1850, 0.62, 5.8],
      [22, 0.3, 650, 0.89, 4.9]
    ];

    const pesos = [0.20, 0.20, 0.15, 0.25, 0.20];

    const tipos = [
      "custo",
      "beneficio",
      "beneficio",
      "custo",
      "beneficio"
    ];

    const resultado = topsis(matriz, pesos, tipos);

    expect(resultado[0].posicao).toBe(1);
    expect(resultado[1].posicao).toBe(2);
    expect(resultado[2].posicao).toBe(3);

    expect(resultado[0].indice).toBe(1);
    expect(resultado[1].indice).toBe(0);
    expect(resultado[2].indice).toBe(2);
  });

  test("o coeficiente Ci deve estar entre 0 e 1", () => {
    const matriz = [
      [15, 0.8, 980, 0.75, 5.2],
      [5, 2.1, 1850, 0.62, 5.8],
      [22, 0.3, 650, 0.89, 4.9]
    ];

    const pesos = [0.20, 0.20, 0.15, 0.25, 0.20];

    const tipos = [
      "custo",
      "beneficio",
      "beneficio",
      "custo",
      "beneficio"
    ];

    const resultado = topsis(matriz, pesos, tipos);

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

    const pesos = [0.20, 0.20, 0.15, 0.25, 0.20];

    const tipos = [
      "custo",
      "beneficio",
      "beneficio",
      "custo",
      "beneficio"
    ];

    const resultado = topsis(matriz, pesos, tipos);

    expect(resultado).toHaveLength(3);

    expect(resultado.map((item) => item.posicao)).toEqual([
      1,
      2,
      3
    ]);
  });
});