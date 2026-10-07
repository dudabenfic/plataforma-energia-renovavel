import MapView from "./MapView";
import { useEffect, useState } from "react";
import axios from "axios";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import "./index.css";

function App() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [pesos, setPesos] = useState([]);
  const [simulacoes, setSimulacoes] = useState([]);

  useEffect(() => {
    executarTopsis();
    carregarSimulacoes();
  }, []);

  function alterarPeso(index, valor) {
    const novosPesos = [...pesos];
    novosPesos[index] = Number(valor);
    setPesos(novosPesos);
    } 

  async function carregarSimulacoes() {
  try {
    const resposta = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/simulacoes`
    );

    setSimulacoes(resposta.data.simulacoes);
  } catch (error) {
    console.error("Erro ao carregar simulações:", error);
  }
}

  async function executarTopsis() {
    try {
      const resposta = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/topsis/executar`,
        {
          pesos
        }
      );

      setDados(resposta.data);

      setPesos((pesosAtuais) => {
        if (pesosAtuais.length === 0) {
          return resposta.data.criterios.map(
            (criterio) => criterio.peso
          );
        }

        return pesosAtuais;
      });

      await carregarSimulacoes();

    } catch (error) {
      console.error(error);
      setErro("Não foi possível carregar os dados.");
    } finally {
      setCarregando(false);
    }
  }

  if (carregando) {
    return <div className="loading">Carregando...</div>;
  }

  if (erro) {
    return <div className="error">{erro}</div>;
  }

  async function importarCSV(event) {
    const arquivo = event.target.files[0];

    if (!arquivo) return;

    const formulario = new FormData();
    formulario.append("arquivo", arquivo);

    try {
      const resposta = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/importar-csv`,
        formulario
      );

      alert(resposta.data.mensagem);

      await executarTopsis();
      await carregarSimulacoes();

    } catch (error) {
      console.error("Erro ao importar CSV:", error);

      alert(
        error.response?.data?.erro ||
        "Erro ao importar o arquivo."
      );
    }

    event.target.value = "";
  }

  function exportarCSV() {
    if (!dados || !dados.ranking) return;

    const linhas = [
      ["Posição", "Município", "UF", "Coeficiente TOPSIS"],
      ...dados.ranking.map((resultado) => {
        const municipio = dados.municipios[resultado.indice];

        return [
          resultado.posicao,
          municipio.nome,
          municipio.uf,
          resultado.ci.toFixed(4)
        ];
      })
    ];

    const csv = linhas
      .map((linha) => linha.join(","))
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });

    saveAs(blob, "ranking-topsis.csv");
  }

  function exportarPDF() {
    if (!dados || !dados.ranking) return;

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Relatório TOPSIS", 14, 20);

    doc.setFontSize(11);
    doc.text(
      `Data: ${new Date().toLocaleString("pt-BR")}`,
      14,
      30
    );

    doc.text(
      `Municípios analisados: ${dados.municipios.length}`,
      14,
      37
    );

    doc.text(
      `Critérios utilizados: ${dados.criterios.length}`,
      14,
      44
    );

    doc.setFontSize(14);
    doc.text("Pesos dos critérios", 14, 56);

    autoTable(doc, {
      startY: 62,
      head: [["Critério", "Tipo", "Peso"]],
      body: dados.criterios.map((criterio, index) => [
        criterio.nome,
        criterio.tipo,
        `${(dados.pesos?.[index] ?? criterio.peso) * 100}%`
      ])
    });

    const inicioRanking = doc.lastAutoTable.finalY + 15;

    doc.setFontSize(14);
    doc.text("Ranking TOPSIS", 14, inicioRanking);

    autoTable(doc, {
      startY: inicioRanking + 6,
      head: [[
        "Posição",
        "Município",
        "UF",
        "CI TOPSIS",
        "Dist. +",
        "Dist. -"
      ]],
      body: dados.ranking.map((resultado) => {
        const municipio = dados.municipios[resultado.indice];

        return [
          resultado.posicao,
          municipio.nome,
          municipio.uf,
          resultado.ci.toFixed(4),
          resultado.distanciaPositiva.toFixed(4),
          resultado.distanciaNegativa.toFixed(4)
        ];
      })
    });

    doc.save("relatorio-topsis.pdf");
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Plataforma de Energia Renovável</h1>
          <p>
            Análise multicritério de vulnerabilidade social e energia renovável
          </p>
        </div>

        <button onClick={executarTopsis}>
          Executar TOPSIS
        </button>
      </header>

      <main className="content">
        <section className="cards">
          <div className="card">
            <span>Municípios</span>
            <strong>{dados.municipios.length}</strong>
          </div>

          <div className="card">
            <span>Critérios</span>
            <strong>{dados.criterios.length}</strong>
          </div>

          <div className="card">
            <span>Melhor município</span>
            <strong>{dados.ranking[0].municipio}</strong>
          </div>

          <div className="card">
            <span>Coeficiente CI</span>
            <strong>
              {dados.ranking[0].ci.toFixed(4)}
            </strong>
          </div>
        </section>

        <section className="panel">
          <h2>Ranking TOPSIS</h2>

          <div className="export-buttons">
            <button className="export-button" onClick={exportarCSV}>
              📥 Exportar CSV
            </button>

            <button className="export-button" onClick={exportarPDF}>
              📄 Exportar PDF
            </button>

            <label className="import-button">
              📤 Importar CSV
              <input
                type="file"
                accept=".csv"
                onChange={importarCSV}
                hidden
              />
            </label>
          </div>

          <table>
            <thead>
              <tr>
                <th>Posição</th>
                <th>Município</th>
                <th>UF</th>
                <th>Coeficiente CI</th>
              </tr>
            </thead>

            <tbody>
              {dados.ranking.map((item) => (
                <tr key={item.municipio}>
                  <td>{item.posicao}º</td>
                  <td>{item.municipio}</td>
                  <td>{item.uf}</td>
                  <td>{item.ci.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="panel">
          <h2>Comparação dos municípios</h2>

          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={dados.ranking}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="municipio" />

              <YAxis domain={[0, 1]} />

              <Tooltip />

              <Bar
                dataKey="ci"
                name="Coeficiente CI"
              />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="panel">
          <h2>Configuração dos critérios</h2>

          <p>
            Defina a importância de cada critério para a análise TOPSIS.
          </p>

          <div className="criteria-grid">
            {dados.criterios.map((criterio, index) => (
              <div className="criteria" key={criterio.id}>
                <strong>{criterio.nome}</strong>

                <label>
                  Peso: {(pesos[index] * 100).toFixed(0)}%
                </label>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={pesos[index] ?? 0}
                  onChange={(e) =>
                    alterarPeso(index, e.target.value)
                  }
                />
              </div>
            ))}
          </div>

          <p>
            Soma dos pesos:{" "}
            <strong>
              {(pesos.reduce((soma, peso) => soma + peso, 0) * 100).toFixed(0)}%
            </strong>
          </p>
        </section>

        <section className="panel">
          <h2>Critérios utilizados</h2>

          <div className="criteria-grid">
            {dados.criterios.map((criterio) => (
              <div className="criteria" key={criterio.id}>
                <strong>{criterio.nome}</strong>

                <span>
                  {criterio.tipo === "beneficio"
                    ? "Benefício"
                    : "Custo"}
                </span>

                <small>
                  Peso: {(criterio.peso * 100).toFixed(0)}%
                </small>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
  <h2>Visualização georreferenciada</h2>

  <p>
    Distribuição dos municípios analisados.
  </p>

  <MapView
    municipios={dados.municipios}
    ranking={dados.ranking}
  />
</section>

<section className="panel">
  <h2>Histórico de simulações</h2>

  {simulacoes.length === 0 ? (
    <p>Nenhuma simulação registrada.</p>
  ) : (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Data</th>
            <th>Status</th>
            <th>Pesos utilizados</th>
          </tr>
        </thead>

        <tbody>
          {simulacoes.slice(0, 10).map((simulacao) => (
            <tr key={simulacao.id}>
              <td>#{simulacao.id}</td>

              <td>
                {new Date(
                  simulacao.data_execucao
                ).toLocaleString("pt-BR")}
              </td>

              <td>
                <span className="status">
                  {simulacao.status}
                </span>
              </td>

              <td>
                {simulacao.parametros.pesos
                  .map((peso) => `${(peso * 100).toFixed(0)}%`)
                  .join(" / ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</section>
      </main>
    </div>
  );
}

export default App;