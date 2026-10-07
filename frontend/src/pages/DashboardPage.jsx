import { useEffect, useState } from "react";
import api, { mensagemDeErro } from "../services/api";
import { navegar } from "../hooks/useHashRoute";
import MapView from "../components/MapView";
import RankingChart from "../components/RankingChart";
import ComparacaoMunicipios from "../components/ComparacaoMunicipios";
import { Alerta, Carregando } from "../components/Feedback";
import {
  faixaVulnerabilidade,
  formatarCi,
  formatarData,
  normalizarRanking
} from "../utils/formatacao";

// RF05 — dashboard com o resultado da simulação mais recente.
function DashboardPage() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        const [indicadores, historico] = await Promise.all([
          api.get("/indicadores"),
          api.get("/simulacoes", { params: { limite: 1, status: "concluida" } })
        ]);

        let ultima = null;
        const [maisRecente] = historico.data.simulacoes;

        if (maisRecente) {
          const detalhe = await api.get(`/simulacoes/${maisRecente.id}`);
          ultima = {
            simulacao: detalhe.data.simulacao,
            ranking: normalizarRanking(detalhe.data.ranking)
          };
        }

        setDados({ ...indicadores.data, ultima, totalSimulacoes: historico.data.total });
      } catch (error) {
        setErro(mensagemDeErro(error, "Não foi possível carregar o dashboard."));
      }
    }

    carregar();
  }, []);

  if (erro) return <Alerta>{erro}</Alerta>;
  if (!dados) return <Carregando />;

  const ranking = dados.ultima?.ranking ?? [];
  const mediaCi = ranking.length
    ? ranking.reduce((soma, item) => soma + item.ci, 0) / ranking.length
    : null;
  const maisVulneravel = ranking.at(-1);
  const menosVulneravel = ranking[0];

  return (
    <>
      <div className="titulo-pagina">
        <div>
          <h2>Dashboard</h2>
          <p>
            {dados.ultima
              ? `Resultado da simulação #${dados.ultima.simulacao.id} em ${formatarData(dados.ultima.simulacao.data_execucao)}`
              : "Nenhuma simulação executada ainda."}
          </p>
        </div>
        <button type="button" className="botao" onClick={() => navegar("simulacao")}>
          Nova simulação
        </button>
      </div>

      <section className="cards">
        <div className="card">
          <span>Municípios cadastrados</span>
          <strong>{dados.municipios.length}</strong>
        </div>
        <div className="card">
          <span>Critérios ativos</span>
          <strong>{dados.criterios.length}</strong>
        </div>
        <div className="card">
          <span>Média do Ci</span>
          <strong>{mediaCi === null ? "—" : formatarCi(mediaCi)}</strong>
        </div>
        <div className="card destaque-alerta">
          <span>Município mais vulnerável</span>
          <strong>{maisVulneravel ? `${maisVulneravel.municipio} - ${maisVulneravel.uf}` : "—"}</strong>
          {maisVulneravel && <small>Ci {formatarCi(maisVulneravel.ci)}</small>}
        </div>
        <div className="card destaque-sucesso">
          <span>Município menos vulnerável</span>
          <strong>{menosVulneravel ? `${menosVulneravel.municipio} - ${menosVulneravel.uf}` : "—"}</strong>
          {menosVulneravel && <small>Ci {formatarCi(menosVulneravel.ci)}</small>}
        </div>
        <div className="card">
          <span>Simulações registradas</span>
          <strong>{dados.totalSimulacoes}</strong>
        </div>
      </section>

      <div className="grade-2">
        <section className="panel">
          <h3>Ranking por coeficiente Ci</h3>
          {ranking.length > 0 ? (
            <>
              <RankingChart ranking={ranking} />
              <p className="texto-suave">
                Quanto maior o Ci, mais próximo da solução ideal e menor a vulnerabilidade.
                {maisVulneravel && ` Faixa do último colocado: ${faixaVulnerabilidade(maisVulneravel.ci).rotulo.toLowerCase()}.`}
              </p>
              <button
                type="button"
                className="botao-link"
                onClick={() => navegar(`historico/${dados.ultima.simulacao.id}`)}
              >
                Ver detalhes e exportar relatório
              </button>
            </>
          ) : (
            <p className="texto-suave">Execute uma simulação para ver o ranking.</p>
          )}
        </section>

        <section className="panel">
          <h3>Mapa de vulnerabilidade</h3>
          <MapView municipios={dados.municipios} ranking={ranking} criterios={dados.criterios} altura={380} />
        </section>
      </div>

      <section className="panel">
        <h3>Comparação entre municípios</h3>
        <p className="texto-suave">
          Indicadores do ano de referência {dados.ano_referencia ?? "—"}.
        </p>
        <ComparacaoMunicipios municipios={dados.municipios} criterios={dados.criterios} />
      </section>
    </>
  );
}

export default DashboardPage;
