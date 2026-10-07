const bcrypt = require("bcryptjs");

// Dados de demonstração (os mesmos do banco): exemplo do professor
// com C1–C5 e valores demonstrativos para C6 e C7.
const SENHA_TESTE = "senha123";
const HASH_TESTE = bcrypt.hashSync(SENHA_TESTE, 4);

const VALORES = {
  1: [15, 0.8, 980, 0.75, 5.2, 18, 4],
  2: [5, 2.1, 1850, 0.62, 5.8, 7, 8],
  3: [22, 0.3, 650, 0.89, 4.9, 25, 2]
};

function criarDadosIniciais() {
  const matriz = [];

  for (const [municipioId, valores] of Object.entries(VALORES)) {
    valores.forEach((valor, j) => {
      matriz.push({
        id: matriz.length + 1,
        municipio_id: Number(municipioId),
        criterio_id: j + 1,
        valor,
        ano_referencia: 2026
      });
    });
  }

  return {
    usuarios: [
      { id: 1, nome: "Admin", email: "admin@teste.com", senha_hash: HASH_TESTE, perfil: "admin", ativo: true },
      { id: 2, nome: "Pesquisadora", email: "pesquisa@teste.com", senha_hash: HASH_TESTE, perfil: "pesquisador", ativo: true },
      { id: 3, nome: "Gestor", email: "gestor@teste.com", senha_hash: HASH_TESTE, perfil: "gestor", ativo: true },
      { id: 4, nome: "Inativo", email: "inativo@teste.com", senha_hash: HASH_TESTE, perfil: "pesquisador", ativo: false }
    ],
    municipios: [
      { id: 1, nome: "Município A", uf: "BA", populacao: 100000, idh: 0.7, latitude: -12.9711, longitude: -38.5014 },
      { id: 2, nome: "Município B", uf: "BA", populacao: 150000, idh: 0.8, latitude: -22.9068, longitude: -43.1729 },
      { id: 3, nome: "Município C", uf: "BA", populacao: 80000, idh: 0.6, latitude: -15.7942, longitude: -47.8825 }
    ],
    criterios: [
      { id: 1, codigo: "C1", nome: "% domicílios sem acesso à eletricidade", tipo: "custo", peso: 0.2, unidade: "%", fonte: "IBGE", ativo: true },
      { id: 2, codigo: "C2", nome: "Capacidade instalada solar", tipo: "beneficio", peso: 0.2, unidade: "kW/hab", fonte: "ANEEL", ativo: true },
      { id: 3, codigo: "C3", nome: "Renda per capita", tipo: "beneficio", peso: 0.15, unidade: "R$", fonte: "IBGE", ativo: true },
      { id: 4, codigo: "C4", nome: "Tarifa média de energia", tipo: "custo", peso: 0.25, unidade: "R$/kWh", fonte: "ANEEL", ativo: true },
      { id: 5, codigo: "C5", nome: "Índice de irradiação solar", tipo: "beneficio", peso: 0.2, unidade: "kWh/m²/dia", fonte: "INPE", ativo: true },
      { id: 6, codigo: "C6", nome: "% população em extrema pobreza", tipo: "custo", peso: 0, unidade: "%", fonte: "IBGE", ativo: true },
      { id: 7, codigo: "C7", nome: "Projetos de energia renovável ativos", tipo: "beneficio", peso: 0, unidade: "projetos", fonte: "ANEEL", ativo: true }
    ],
    matriz_decisao: matriz,
    simulacoes: [
      {
        id: 1,
        usuario_id: null,
        data_execucao: "2026-10-05T10:00:00",
        status: "concluida",
        parametros: { pesos: [0.2, 0.2, 0.15, 0.25, 0.2], tipos: ["custo", "beneficio", "beneficio", "custo", "beneficio"] }
      }
    ],
    resultados_ranking: [
      { id: 1, simulacao_id: 1, municipio_id: 3, coeficiente_ci: 0, distancia_positiva: 0.2, distancia_negativa: 0, posicao: 3 },
      { id: 2, simulacao_id: 1, municipio_id: 2, coeficiente_ci: 1, distancia_positiva: 0, distancia_negativa: 0.2, posicao: 1 },
      { id: 3, simulacao_id: 1, municipio_id: 1, coeficiente_ci: 0.33, distancia_positiva: 0.15, distancia_negativa: 0.07, posicao: 2 }
    ]
  };
}

module.exports = { criarDadosIniciais, SENHA_TESTE };
