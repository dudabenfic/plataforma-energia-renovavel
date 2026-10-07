import { useEffect, useState } from "react";
import api, { mensagemDeErro } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import MapView from "../components/MapView";
import RankingChart from "../components/RankingChart";
import RankingTable from "../components/RankingTable";
import BotoesExportacao from "../components/BotoesExportacao";
import { Alerta, Carregando } from "../components/Feedback";
import { formatarPercentual, nomeTipo, normalizarRanking } from "../utils/formatacao";

function somar(pesos) {
  return pesos.reduce((total, peso) => total + peso, 0);
}

function somaValida(pesos) {
  return Math.abs(somar(pesos) - 1) <= 0.001;
}

// RF03 + RF04 — configuração dos pesos e execução do TOPSIS.
function SimulacaoPage() {
  const { usuario, podeEditar } = useAuth();
  const [base, setBase] = useState(null);
  const [pesos, setPesos] = useState([]);
  const [ano, setAno] = useState("");
  const [selecionados, setSelecionados] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [executando, setExecutando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    api
      .get("/indicadores")
      .then(({ data }) => {
        setBase(data);
        setPesos(data.criterios.map((c) => Number(c.peso)));
        setAno(data.ano_referencia ?? "");
        setSelecionados(data.municipios.map((m) => m.id));
      })
      .catch((error) => setErro(mensagemDeErro(error, "Não foi possível carregar os critérios.")));
  }, []);

  // Leva o usuário até o resultado após cada execução.
  useEffect(() => {
    if (resultado) {
      document.getElementById("resultado")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [resultado]);

  if (!base) return erro ? <Alerta>{erro}</Alerta> : <Carregando />;

  const { criterios, municipios, anos } = base;
  const soma = somar(pesos);

  function alterarPeso(indice, valor) {
    setPesos(pesos.map((peso, j) => (j === indice ? Number(valor) : peso)));
  }

  function distribuirIgualmente() {
    const parte = Math.floor((1 / criterios.length) * 1000) / 1000;
    const novos = criterios.map(() => parte);
    novos[novos.length - 1] = Number((1 - parte * (criterios.length - 1)).toFixed(3));
    setPesos(novos);
  }

  function alternarMunicipio(id) {
    setSelecionados(
      selecionados.includes(id)
        ? selecionados.filter((item) => item !== id)
        : [...selecionados, id]
    );
  }

  async function salvarPadrao() {
    setSalvando(true);
    setErro("");
    setAviso("");

    try {
      const { data } = await api.put("/criterios/pesos", {
        pesos: criterios.map((c, j) => ({ criterio_id: c.id, peso: pesos[j] }))
      });

      setBase({ ...base, criterios: data.criterios });
      setAviso("Pesos salvos como padrão.");
    } catch (error) {
      setErro(mensagemDeErro(error));
    } finally {
      setSalvando(false);
    }
  }

  async function executar() {
    setExecutando(true);
    setErro("");
    setAviso("");

    try {
      const { data } = await api.post("/topsis/executar", {
        pesos: criterios.map((c, j) => ({ criterio_id: c.id, peso: pesos[j] })),
        ano_referencia: ano === "" ? undefined : Number(ano),
        municipio_ids: selecionados
      });

      setResultado({
        ...data,
        ranking: normalizarRanking(data.ranking),
        criteriosUsados: data.simulacao.parametros.criterios
      });

    } catch (error) {
      setErro(mensagemDeErro(error, "Não foi possível executar o TOPSIS."));
    } finally {
      setExecutando(false);
    }
  }

  const podeExecutar = somaValida(pesos) && selecionados.length >= 2 && !executando;

  return (
    <>
      <div className="titulo-pagina">
        <div>
          <h2>Simulação TOPSIS</h2>
          <p>Defina os pesos dos critérios (soma = 100%), escolha os municípios e execute.</p>
        </div>
      </div>

      <section className="panel">
        <h3>Pesos dos critérios</h3>

        <div className="table-container">
          <table className="tabela-pesos">
            <thead>
              <tr>
                <th>Critério</th>
                <th>Tipo</th>
                <th>Fonte</th>
                <th className="coluna-peso">Peso</th>
              </tr>
            </thead>
            <tbody>
              {criterios.map((criterio, j) => (
                <tr key={criterio.id}>
                  <td>
                    <strong>{criterio.codigo}</strong> {criterio.nome}
                    {criterio.unidade && <small className="texto-suave"> ({criterio.unidade})</small>}
                  </td>
                  <td>
                    <span className={`tipo tipo-${criterio.tipo}`}>{nomeTipo(criterio.tipo)}</span>
                  </td>
                  <td>{criterio.fonte ?? "—"}</td>
                  <td className="coluna-peso">
                    <div className="controle-peso">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={pesos[j] ?? 0}
                        onChange={(e) => alterarPeso(j, e.target.value)}
                        aria-label={`Peso de ${criterio.codigo}`}
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={Math.round((pesos[j] ?? 0) * 100)}
                        onChange={(e) => alterarPeso(j, Number(e.target.value) / 100)}
                        aria-label={`Peso de ${criterio.codigo} em porcentagem`}
                      />
                      <span>%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className={`soma-pesos ${somaValida(pesos) ? "ok" : "erro"}`}>
          Soma dos pesos: <strong>{formatarPercentual(soma, 1)}</strong>
          {!somaValida(pesos) && " — ajuste para 100% para executar."}
        </p>

        <div className="acoes">
          <button
            type="button"
            className="botao secundario"
            onClick={() => setPesos(criterios.map((c) => Number(c.peso)))}
          >
            Restaurar pesos salvos
          </button>
          <button type="button" className="botao secundario" onClick={distribuirIgualmente}>
            Distribuir igualmente
          </button>
          {podeEditar && (
            <button
              type="button"
              className="botao secundario"
              onClick={salvarPadrao}
              disabled={!somaValida(pesos) || salvando}
            >
              {salvando ? "Salvando..." : "Salvar como padrão"}
            </button>
          )}
        </div>
      </section>

      <section className="panel">
        <h3>Alternativas (municípios)</h3>

        <div className="linha-filtros">
          <label className="campo campo-inline">
            Ano de referência
            <select value={ano} onChange={(e) => setAno(e.target.value)}>
              {anos.length === 0 && <option value="">Sem dados</option>}
              {anos.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <button type="button" className="botao-link" onClick={() => setSelecionados(municipios.map((m) => m.id))}>
            Selecionar todos
          </button>
          <button type="button" className="botao-link" onClick={() => setSelecionados([])}>
            Limpar seleção
          </button>
        </div>

        <div className="chips">
          {municipios.map((m) => (
            <button
              type="button"
              key={m.id}
              className={`chip ${selecionados.includes(m.id) ? "ativo" : ""}`}
              onClick={() => alternarMunicipio(m.id)}
              aria-pressed={selecionados.includes(m.id)}
            >
              {m.nome} - {m.uf}
            </button>
          ))}
        </div>

        <p className="texto-suave">
          {selecionados.length} de {municipios.length} município(s) selecionado(s). São necessários ao menos 2.
        </p>

        <Alerta aoFechar={() => setErro("")}>{erro}</Alerta>
        <Alerta tipo="sucesso" aoFechar={() => setAviso("")}>{aviso}</Alerta>

        <button type="button" className="botao botao-grande" onClick={executar} disabled={!podeExecutar}>
          {executando ? "Calculando..." : "Executar TOPSIS"}
        </button>
      </section>

      {resultado && (
        <div id="resultado">
          <section className="panel">
            <div className="titulo-secao">
              <div>
                <h3>Resultado — simulação #{resultado.simulacao.id}</h3>
                <p className="texto-suave">
                  Ano de referência {resultado.ano_referencia} · {resultado.ranking.length} municípios ·
                  calculado em {resultado.tempoCalculoMs} ms
                </p>
              </div>
              <BotoesExportacao
                ranking={resultado.ranking}
                simulacao={resultado.simulacao}
                criterios={resultado.criteriosUsados}
                anoReferencia={resultado.ano_referencia}
                municipios={resultado.municipios}
                usuario={usuario?.nome}
              />
            </div>

            {resultado.municipiosIgnorados.length > 0 && (
              <Alerta tipo="aviso">
                Municípios fora da análise por falta de indicadores:{" "}
                {resultado.municipiosIgnorados
                  .map((m) => `${m.municipio} (${m.criteriosSemValor.join(", ")})`)
                  .join("; ")}
              </Alerta>
            )}

            <RankingTable ranking={resultado.ranking} />
          </section>

          <div className="grade-2">
            <section className="panel">
              <h3>Coeficiente Ci por município</h3>
              <RankingChart ranking={resultado.ranking} />
            </section>
            <section className="panel">
              <h3>Mapa</h3>
              <MapView municipios={resultado.municipios} ranking={resultado.ranking} altura={380} />
            </section>
          </div>
        </div>
      )}
    </>
  );
}

export default SimulacaoPage;
