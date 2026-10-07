import { useState } from "react";
import api, { mensagemDeErro } from "../services/api";
import { Alerta } from "../components/Feedback";

const FONTES = [
  {
    codigo: "C1",
    indicador: "% domicílios sem acesso à eletricidade",
    fonte: "IBGE — Censo Demográfico 2022",
    url: "https://www.ibge.gov.br/estatisticas/sociais/trabalho/22827-censo-demografico-2022.html"
  },
  {
    codigo: "C2",
    indicador: "Capacidade instalada solar (kW/hab)",
    fonte: "ANEEL — Empreendimentos de geração distribuída",
    url: "https://dadosabertos.aneel.gov.br/pt_BR/dataset/relacao-de-empreendimentos-de-geracao-distribuida"
  },
  {
    codigo: "C3",
    indicador: "Renda per capita (R$)",
    fonte: "IBGE — Censo Demográfico 2022",
    url: "https://www.ibge.gov.br/estatisticas/sociais/trabalho/22827-censo-demografico-2022.html"
  },
  {
    codigo: "C4",
    indicador: "Tarifa média de energia (R$/kWh)",
    fonte: "ANEEL — Tarifas das distribuidoras",
    url: "https://dadosabertos.aneel.gov.br/pt_BR/dataset/tarifas-distribuidoras-energia-eletrica"
  },
  {
    codigo: "C5",
    indicador: "Irradiação solar (kWh/m²/dia)",
    fonte: "INPE — Atlas Brasileiro de Energia Solar",
    url: "https://www.gov.br/inpe/pt-br/assuntos/assuntos-do-inpe/atlas-brasileiro-de-energia-solar"
  },
  {
    codigo: "C6",
    indicador: "% população em extrema pobreza",
    fonte: "IBGE — Censo Demográfico 2022",
    url: "https://www.ibge.gov.br/estatisticas/sociais/trabalho/22827-censo-demografico-2022.html"
  },
  {
    codigo: "C7",
    indicador: "Nº de projetos de energia renovável ativos",
    fonte: "ANEEL — Empreendimentos de geração distribuída",
    url: "https://dadosabertos.aneel.gov.br/pt_BR/dataset/relacao-de-empreendimentos-de-geracao-distribuida"
  }
];

// RF09 — importação de dados de fontes externas via CSV.
function ImportacaoPage() {
  const [arquivo, setArquivo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);

  async function enviar(evento) {
    evento.preventDefault();

    if (!arquivo) return;

    const formulario = new FormData();
    formulario.append("arquivo", arquivo);

    setEnviando(true);
    setResultado(null);
    setErro(null);

    try {
      const { data } = await api.post("/importar-csv", formulario);
      setResultado(data);
    } catch (error) {
      setErro({
        mensagem: mensagemDeErro(error, "Erro ao importar o arquivo."),
        linhas: error.response?.data?.erros ?? []
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <div className="titulo-pagina">
        <div>
          <h2>Importação de dados</h2>
          <p>
            Carregue indicadores obtidos no IBGE, na ANEEL e no INPE por meio de um arquivo CSV.
            O arquivo é validado por completo antes de qualquer gravação.
          </p>
        </div>
      </div>

      <div className="grade-2">
        <form className="panel" onSubmit={enviar}>
          <h3>Enviar arquivo</h3>

          <label className="campo">
            Arquivo CSV (até 2 MB)
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                setArquivo(e.target.files[0] ?? null);
                setResultado(null);
                setErro(null);
              }}
            />
          </label>

          <div className="acoes">
            <button type="submit" className="botao" disabled={!arquivo || enviando}>
              {enviando ? "Importando..." : "Importar"}
            </button>
            <a className="botao secundario" href="/modelo-importacao.csv" download>
              Baixar modelo
            </a>
          </div>

          {resultado && (
            <Alerta tipo="sucesso">
              <strong>{resultado.mensagem}</strong>
              <br />
              Municípios criados: {resultado.resumo.municipiosCriados} · atualizados:{" "}
              {resultado.resumo.municipiosAtualizados} · indicadores gravados:{" "}
              {resultado.resumo.indicadoresGravados}
              <br />
              Critérios reconhecidos: {resultado.resumo.criteriosReconhecidos.join(", ")}
            </Alerta>
          )}

          {resultado?.avisos?.length > 0 && (
            <Alerta tipo="aviso">
              {resultado.avisos.map((aviso) => (
                <div key={aviso}>{aviso}</div>
              ))}
            </Alerta>
          )}

          {erro && (
            <Alerta>
              <strong>{erro.mensagem}</strong>
              {erro.linhas.length > 0 && (
                <div className="table-container">
                  <table className="tabela-compacta">
                    <thead>
                      <tr>
                        <th>Linha</th>
                        <th>Campo</th>
                        <th>Problema</th>
                      </tr>
                    </thead>
                    <tbody>
                      {erro.linhas.slice(0, 100).map((item, i) => (
                        <tr key={i}>
                          <td>{item.linha}</td>
                          <td>{item.campo}</td>
                          <td>{item.mensagem}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Alerta>
          )}
        </form>

        <section className="panel">
          <h3>Formato do arquivo</h3>
          <ul className="lista">
            <li>Separador vírgula (<code>,</code>) ou ponto e vírgula (<code>;</code>). Com <code>;</code>, a vírgula decimal é aceita.</li>
            <li>Obrigatórias: <code>nome</code>, <code>uf</code>, <code>ano</code>.</li>
            <li>Opcionais: <code>populacao</code>, <code>idh</code>, <code>latitude</code>, <code>longitude</code>.</li>
            <li>Indicadores: uma coluna por código de critério (<code>C1</code> a <code>C7</code>). Células vazias são ignoradas.</li>
            <li>Municípios já cadastrados (mesmo nome e UF) são atualizados; os novos são criados.</li>
            <li>Valores do mesmo município, critério e ano substituem os anteriores.</li>
          </ul>
          <pre className="exemplo-csv">
nome,uf,ano,populacao,idh,latitude,longitude,C1,C2,C3,C4,C5,C6,C7{"\n"}
Município A,BA,2026,100000,0.7,-12.97,-38.50,15,0.8,980,0.75,5.2,18,4
          </pre>
        </section>
      </div>

      <section className="panel">
        <h3>Fontes oficiais dos indicadores</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Critério</th>
                <th>Indicador</th>
                <th>Fonte</th>
              </tr>
            </thead>
            <tbody>
              {FONTES.map((item) => (
                <tr key={item.codigo}>
                  <td><strong>{item.codigo}</strong></td>
                  <td>{item.indicador}</td>
                  <td>
                    <a href={item.url} target="_blank" rel="noreferrer">{item.fonte}</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export default ImportacaoPage;
