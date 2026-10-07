import { useEffect, useState } from "react";
import api, { mensagemDeErro } from "../services/api";
import { navegar } from "../hooks/useHashRoute";
import RankingTable from "../components/RankingTable";
import BotoesExportacao from "../components/BotoesExportacao";
import { Alerta, Carregando, Vazio } from "../components/Feedback";
import {
  criteriosDaSimulacao,
  formatarData,
  formatarPercentual,
  nomeTipo,
  normalizarRanking
} from "../utils/formatacao";

const LIMITE = 20;
const FILTROS_INICIAIS = { minhas: false, status: "", data_inicio: "", data_fim: "" };

async function consultar(filtros, deslocamento) {
  const params = { limite: LIMITE, deslocamento };
  if (filtros.minhas) params.minhas = true;
  if (filtros.status) params.status = filtros.status;
  if (filtros.data_inicio) params.data_inicio = filtros.data_inicio;
  if (filtros.data_fim) params.data_fim = filtros.data_fim;

  const { data } = await api.get("/simulacoes", { params });
  return data;
}

function DetalheSimulacao({ id, criteriosAtuais }) {
  const [detalhe, setDetalhe] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api
      .get(`/simulacoes/${id}`)
      .then(({ data }) => setDetalhe(data))
      .catch((error) => setErro(mensagemDeErro(error, "Não foi possível abrir a simulação.")));
  }, [id]);

  if (erro) return <Alerta>{erro}</Alerta>;
  if (!detalhe) return <Carregando texto="Carregando simulação..." />;

  const { simulacao } = detalhe;
  const ranking = normalizarRanking(detalhe.ranking);
  const criterios = criteriosDaSimulacao(simulacao, criteriosAtuais);
  const parametros = simulacao.parametros ?? {};

  return (
    <section className="panel" id="detalhe">
      <div className="titulo-secao">
        <div>
          <h3>Simulação #{simulacao.id}</h3>
          <p className="texto-suave">
            {formatarData(simulacao.data_execucao)} ·{" "}
            {simulacao.usuario ? `por ${simulacao.usuario.nome}` : "usuário não registrado (anterior à autenticação)"} ·{" "}
            status {simulacao.status}
            {parametros.ano_referencia ? ` · ano de referência ${parametros.ano_referencia}` : ""}
          </p>
        </div>
        {ranking.length > 0 && (
          <BotoesExportacao
            ranking={ranking}
            simulacao={simulacao}
            criterios={criterios}
            anoReferencia={parametros.ano_referencia}
            usuario={simulacao.usuario?.nome}
          />
        )}
      </div>

      <h4>Parâmetros</h4>
      {!Array.isArray(parametros.criterios) && (
        <p className="texto-suave">
          Simulação antiga: os nomes dos critérios foram associados pela ordem atual.
        </p>
      )}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Critério</th>
              <th>Tipo</th>
              <th>Peso</th>
            </tr>
          </thead>
          <tbody>
            {criterios.map((c, j) => (
              <tr key={c.codigo ?? j}>
                <td><strong>{c.codigo}</strong> {c.nome}</td>
                <td>{nomeTipo(c.tipo)}</td>
                <td>{formatarPercentual(c.peso, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h4>Ranking</h4>
      {ranking.length > 0 ? <RankingTable ranking={ranking} /> : <Vazio>Sem resultados gravados.</Vazio>}
    </section>
  );
}

// RF10 — histórico das simulações TOPSIS.
function HistoricoPage({ simulacaoId }) {
  const [filtros, setFiltros] = useState(FILTROS_INICIAIS);
  const [lista, setLista] = useState([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [criterios, setCriterios] = useState([]);

  // Primeira página: recarrega sempre que os filtros mudam.
  useEffect(() => {
    let ativo = true;

    consultar(filtros, 0)
      .then((data) => {
        if (!ativo) return;
        setLista(data.simulacoes);
        setTotal(data.total);
        setErro("");
      })
      .catch((error) => ativo && setErro(mensagemDeErro(error, "Não foi possível carregar o histórico.")))
      .finally(() => ativo && setCarregando(false));

    return () => {
      ativo = false;
    };
  }, [filtros]);

  async function carregarMais() {
    setCarregando(true);

    try {
      const data = await consultar(filtros, lista.length);
      setLista([...lista, ...data.simulacoes]);
      setTotal(data.total);
    } catch (error) {
      setErro(mensagemDeErro(error, "Não foi possível carregar o histórico."));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    api.get("/criterios").then(({ data }) => setCriterios(data.criterios)).catch(() => {});
  }, []);

  useEffect(() => {
    if (simulacaoId) document.getElementById("detalhe")?.scrollIntoView({ behavior: "smooth" });
  }, [simulacaoId]);

  function alterarFiltro(evento) {
    const { name, value, type, checked } = evento.target;
    setCarregando(true);
    setFiltros({ ...filtros, [name]: type === "checkbox" ? checked : value });
  }

  return (
    <>
      <div className="titulo-pagina">
        <div>
          <h2>Histórico de simulações</h2>
          <p>Consulte as execuções anteriores do TOPSIS, seus parâmetros e rankings.</p>
        </div>
      </div>

      {simulacaoId && <DetalheSimulacao key={simulacaoId} id={simulacaoId} criteriosAtuais={criterios} />}

      <section className="panel">
        <div className="linha-filtros">
          <label className="campo campo-inline">
            Status
            <select name="status" value={filtros.status} onChange={alterarFiltro}>
              <option value="">Todos</option>
              <option value="concluida">Concluída</option>
              <option value="erro">Erro</option>
            </select>
          </label>
          <label className="campo campo-inline">
            De
            <input type="date" name="data_inicio" value={filtros.data_inicio} onChange={alterarFiltro} />
          </label>
          <label className="campo campo-inline">
            Até
            <input type="date" name="data_fim" value={filtros.data_fim} onChange={alterarFiltro} />
          </label>
          <label className="checkbox">
            <input type="checkbox" name="minhas" checked={filtros.minhas} onChange={alterarFiltro} />
            Somente as minhas
          </label>
          <button type="button" className="botao-link" onClick={() => {
              setCarregando(true);
              setFiltros(FILTROS_INICIAIS);
            }}>
            Limpar filtros
          </button>
        </div>

        <Alerta>{erro}</Alerta>

        {lista.length === 0 && !carregando ? (
          <Vazio>Nenhuma simulação encontrada.</Vazio>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Data</th>
                  <th>Usuário</th>
                  <th>Status</th>
                  <th>Critérios</th>
                  <th>Pesos</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lista.map((simulacao) => {
                  const pesos = simulacao.parametros?.pesos ?? [];

                  return (
                    <tr key={simulacao.id} className={String(simulacao.id) === simulacaoId ? "selecionada" : ""}>
                      <td>#{simulacao.id}</td>
                      <td>{formatarData(simulacao.data_execucao)}</td>
                      <td>{simulacao.usuario?.nome ?? <span className="texto-suave">—</span>}</td>
                      <td>
                        <span className={`status status-${simulacao.status}`}>{simulacao.status}</span>
                      </td>
                      <td>{pesos.length}</td>
                      <td className="pesos-resumo">
                        {pesos.map((peso) => formatarPercentual(peso)).join(" / ")}
                      </td>
                      <td>
                        <button type="button" className="botao-link" onClick={() => navegar(`historico/${simulacao.id}`)}>
                          Abrir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {carregando && <Carregando />}

        <div className="rodape-lista">
          <span className="texto-suave">
            Exibindo {lista.length} de {total} simulação(ões).
          </span>
          {lista.length < total && !carregando && (
            <button type="button" className="botao secundario" onClick={carregarMais}>
              Carregar mais
            </button>
          )}
        </div>
      </section>
    </>
  );
}

export default HistoricoPage;
