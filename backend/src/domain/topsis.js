// Implementação do método TOPSIS
// (Technique for Order Preference by Similarity to Ideal Solution).
//
// matriz: linhas = alternativas (municípios), colunas = critérios
// pesos:  peso de cada critério (soma = 1)
// tipos:  "beneficio" (maior é melhor) ou "custo" (menor é melhor)

// Passo 1 — normalização vetorial de uma coluna: r_ij = x_ij / sqrt(Σ x_ij²)
function normalizar(coluna) {
  const denominador = Math.sqrt(
    coluna.reduce((soma, valor) => soma + valor ** 2, 0)
  );

  return coluna.map((valor) => (denominador === 0 ? 0 : valor / denominador));
}

function normalizarMatriz(matriz) {
  const quantidadeCriterios = matriz[0].length;
  const normalizada = matriz.map(() => Array(quantidadeCriterios).fill(0));

  for (let j = 0; j < quantidadeCriterios; j++) {
    const coluna = normalizar(matriz.map((linha) => linha[j]));

    coluna.forEach((valor, i) => {
      normalizada[i][j] = valor;
    });
  }

  return normalizada;
}

// Passo 2 — matriz ponderada: v_ij = w_j * r_ij
function ponderar(normalizada, pesos) {
  return normalizada.map((linha) => linha.map((valor, j) => valor * pesos[j]));
}

// Passos 3 e 4 — soluções ideais positiva (A+) e negativa (A-)
function solucoesIdeais(ponderada, tipos) {
  const idealPositiva = [];
  const idealNegativa = [];

  for (let j = 0; j < tipos.length; j++) {
    const valores = ponderada.map((linha) => linha[j]);
    const maximo = Math.max(...valores);
    const minimo = Math.min(...valores);

    idealPositiva[j] = tipos[j] === "beneficio" ? maximo : minimo;
    idealNegativa[j] = tipos[j] === "beneficio" ? minimo : maximo;
  }

  return { idealPositiva, idealNegativa };
}

// Passo 5 — distância euclidiana até uma solução ideal
function distancia(linha, ideal) {
  return Math.sqrt(
    linha.reduce((soma, valor, j) => soma + (valor - ideal[j]) ** 2, 0)
  );
}

// Passo 6 — coeficiente de proximidade: Ci = D- / (D+ + D-)
function coeficienteProximidade(distanciaPositiva, distanciaNegativa) {
  const total = distanciaPositiva + distanciaNegativa;

  return total === 0 ? 0 : distanciaNegativa / total;
}

function validarEntrada(matriz, pesos, tipos) {
  if (!Array.isArray(matriz) || matriz.length === 0) {
    throw new Error("A matriz de decisão deve possuir ao menos uma alternativa.");
  }

  const quantidadeCriterios = matriz[0].length;

  if (quantidadeCriterios === 0) {
    throw new Error("A matriz de decisão deve possuir ao menos um critério.");
  }

  if (matriz.some((linha) => linha.length !== quantidadeCriterios)) {
    throw new Error("Todas as linhas da matriz devem ter o mesmo tamanho.");
  }

  if (pesos.length !== quantidadeCriterios || tipos.length !== quantidadeCriterios) {
    throw new Error("Pesos e tipos devem ter um valor para cada critério.");
  }

  if (tipos.some((tipo) => tipo !== "beneficio" && tipo !== "custo")) {
    throw new Error("Tipo de critério inválido.");
  }
}

function topsis(matriz, pesos, tipos) {
  validarEntrada(matriz, pesos, tipos);

  const normalizada = normalizarMatriz(matriz);
  const ponderada = ponderar(normalizada, pesos);
  const { idealPositiva, idealNegativa } = solucoesIdeais(ponderada, tipos);

  const resultados = ponderada.map((linha, i) => {
    const distanciaPositiva = distancia(linha, idealPositiva);
    const distanciaNegativa = distancia(linha, idealNegativa);

    return {
      indice: i,
      ci: coeficienteProximidade(distanciaPositiva, distanciaNegativa),
      distanciaPositiva,
      distanciaNegativa
    };
  });

  // Passo 7 — ranking: maior Ci = menos vulnerável
  resultados.sort((a, b) => b.ci - a.ci);

  return resultados.map((resultado, posicao) => ({
    ...resultado,
    posicao: posicao + 1
  }));
}

module.exports = {
  topsis,
  normalizar,
  normalizarMatriz,
  ponderar,
  solucoesIdeais,
  distancia,
  coeficienteProximidade
};
