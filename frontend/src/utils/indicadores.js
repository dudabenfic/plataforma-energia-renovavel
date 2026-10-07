// Desempenho relativo de 0 a 1 em um critério (1 = melhor valor do conjunto).
// Benefício: (v - min) / (max - min). Custo: (max - v) / (max - min).
export function desempenho(valor, valores, tipo) {
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);

  if (maximo === minimo) return 1;

  return tipo === "beneficio"
    ? (valor - minimo) / (maximo - minimo)
    : (maximo - valor) / (maximo - minimo);
}
