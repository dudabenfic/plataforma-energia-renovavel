function topsis(matriz, pesos, tipos) {
  const quantidadeCriterios = matriz[0].length;

  // 1. Normalização vetorial
  const normalizada = matriz.map(() => Array(quantidadeCriterios).fill(0));

  for (let j = 0; j < quantidadeCriterios; j++) {
    const somaQuadrados = matriz.reduce(
      (soma, linha) => soma + linha[j] ** 2,
      0
    );

    const denominador = Math.sqrt(somaQuadrados);

    for (let i = 0; i < matriz.length; i++) {
      normalizada[i][j] =
        denominador === 0 ? 0 : matriz[i][j] / denominador;
    }
  }

  // 2. Matriz ponderada
  const ponderada = normalizada.map((linha) =>
    linha.map((valor, j) => valor * pesos[j])
  );

  // 3. Solução ideal positiva
  const idealPositiva = [];

  for (let j = 0; j < quantidadeCriterios; j++) {
    const valores = ponderada.map((linha) => linha[j]);

    idealPositiva[j] =
      tipos[j] === "beneficio"
        ? Math.max(...valores)
        : Math.min(...valores);
  }

  // 4. Solução ideal negativa
  const idealNegativa = [];

  for (let j = 0; j < quantidadeCriterios; j++) {
    const valores = ponderada.map((linha) => linha[j]);

    idealNegativa[j] =
      tipos[j] === "beneficio"
        ? Math.min(...valores)
        : Math.max(...valores);
  }

  // 5. Distâncias até as soluções ideais
  const resultados = ponderada.map((linha, i) => {
    let somaPositiva = 0;
    let somaNegativa = 0;

    for (let j = 0; j < quantidadeCriterios; j++) {
      somaPositiva += (linha[j] - idealPositiva[j]) ** 2;
      somaNegativa += (linha[j] - idealNegativa[j]) ** 2;
    }

    const distanciaPositiva = Math.sqrt(somaPositiva);
    const distanciaNegativa = Math.sqrt(somaNegativa);

    // 6. Coeficiente de proximidade
    const ci =
      distanciaPositiva + distanciaNegativa === 0
        ? 0
        : distanciaNegativa /
          (distanciaPositiva + distanciaNegativa);

    return {
      indice: i,
      ci,
      distanciaPositiva,
      distanciaNegativa
    };
  });

  // 7. Ranking: maior Ci = menos vulnerável
  resultados.sort((a, b) => b.ci - a.ci);

  return resultados.map((resultado, posicao) => ({
    ...resultado,
    posicao: posicao + 1
  }));
}

module.exports = { topsis };