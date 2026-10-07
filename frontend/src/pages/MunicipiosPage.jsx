import { useEffect, useState } from "react";
import api, { mensagemDeErro } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { Alerta, Carregando, Vazio } from "../components/Feedback";
import { formatarNumero } from "../utils/formatacao";

const VAZIO = { nome: "", uf: "", populacao: "", idh: "", latitude: "", longitude: "" };

function paraFormulario(municipio, criterios) {
  return {
    dados: {
      nome: municipio.nome ?? "",
      uf: municipio.uf ?? "",
      populacao: municipio.populacao ?? "",
      idh: municipio.idh ?? "",
      latitude: municipio.latitude ?? "",
      longitude: municipio.longitude ?? ""
    },
    valores: Object.fromEntries(
      criterios.map((c) => [c.id, municipio.valores?.[c.id] ?? ""])
    )
  };
}

function opcional(valor) {
  return valor === "" ? null : valor;
}

// RF01 (municípios) + RF02 (indicadores da matriz de decisão).
function MunicipiosPage() {
  const { podeEditar, ehAdmin } = useAuth();
  const [matriz, setMatriz] = useState(null);
  const [ano, setAno] = useState("");
  const [busca, setBusca] = useState("");
  const [edicao, setEdicao] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  // Ano pedido à API ("" = mais recente) e contador para recarregar.
  const [consulta, setConsulta] = useState({ ano: "", versao: 0 });

  useEffect(() => {
    api
      .get("/indicadores", { params: consulta.ano ? { ano: consulta.ano } : {} })
      .then(({ data }) => {
        setMatriz(data);
        setAno(data.ano_referencia ?? new Date().getFullYear());
      })
      .catch((error) => setErro(mensagemDeErro(error, "Não foi possível carregar os municípios.")));
  }, [consulta]);

  const carregar = (anoEscolhido) =>
    setConsulta((atual) => ({ ano: anoEscolhido ?? "", versao: atual.versao + 1 }));

  if (!matriz) return erro ? <Alerta>{erro}</Alerta> : <Carregando />;

  const { criterios } = matriz;
  const termo = busca.trim().toLocaleLowerCase("pt-BR");
  const municipios = matriz.municipios.filter(
    (m) => !termo || `${m.nome} ${m.uf}`.toLocaleLowerCase("pt-BR").includes(termo)
  );

  function abrirNovo() {
    setEdicao({ id: null, ano, ...paraFormulario(VAZIO, criterios) });
    setErro("");
    setAviso("");
  }

  function abrirEdicao(municipio) {
    setEdicao({ id: municipio.id, ano, ...paraFormulario(municipio, criterios) });
    setErro("");
    setAviso("");
  }

  function alterarDado(evento) {
    setEdicao({ ...edicao, dados: { ...edicao.dados, [evento.target.name]: evento.target.value } });
  }

  function alterarValor(criterioId, valor) {
    setEdicao({ ...edicao, valores: { ...edicao.valores, [criterioId]: valor } });
  }

  async function salvar(evento) {
    evento.preventDefault();
    setSalvando(true);
    setErro("");

    const corpo = {
      nome: edicao.dados.nome,
      uf: edicao.dados.uf,
      populacao: opcional(edicao.dados.populacao),
      idh: opcional(edicao.dados.idh),
      latitude: opcional(edicao.dados.latitude),
      longitude: opcional(edicao.dados.longitude)
    };

    try {
      const { data } = edicao.id
        ? await api.put(`/municipios/${edicao.id}`, corpo)
        : await api.post("/municipios", corpo);

      const valores = criterios
        .filter((c) => edicao.valores[c.id] !== "" && edicao.valores[c.id] !== undefined)
        .map((c) => ({ criterio_id: c.id, valor: edicao.valores[c.id] }));

      if (valores.length > 0) {
        await api.put(`/municipios/${data.municipio.id}/indicadores`, {
          ano_referencia: Number(edicao.ano),
          valores
        });
      }

      setAviso(`Município "${data.municipio.nome}" salvo com sucesso.`);
      setEdicao(null);
      carregar(edicao.ano);
    } catch (error) {
      setErro(mensagemDeErro(error));
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(municipio) {
    const confirmado = window.confirm(
      `Excluir "${municipio.nome}"? Os indicadores e resultados de ranking desse município também serão removidos.`
    );

    if (!confirmado) return;

    try {
      await api.delete(`/municipios/${municipio.id}`);
      setAviso(`Município "${municipio.nome}" excluído.`);
      carregar(ano);
    } catch (error) {
      setErro(mensagemDeErro(error));
    }
  }

  return (
    <>
      <div className="titulo-pagina">
        <div>
          <h2>Municípios e indicadores</h2>
          <p>Dados socioeconômicos e valores dos critérios C1 a C7 por ano de referência.</p>
        </div>
        {podeEditar && (
          <button type="button" className="botao" onClick={abrirNovo}>
            Novo município
          </button>
        )}
      </div>

      <Alerta aoFechar={() => setErro("")}>{erro}</Alerta>
      <Alerta tipo="sucesso" aoFechar={() => setAviso("")}>{aviso}</Alerta>

      {edicao && (
        <form className="panel" onSubmit={salvar}>
          <h3>{edicao.id ? "Editar município" : "Novo município"}</h3>

          <div className="grade-formulario">
            <label className="campo">
              Nome *
              <input name="nome" value={edicao.dados.nome} onChange={alterarDado} required maxLength={200} />
            </label>
            <label className="campo">
              UF *
              <input name="uf" value={edicao.dados.uf} onChange={alterarDado} required maxLength={2} pattern="[A-Za-z]{2}" title="Sigla com 2 letras" />
            </label>
            <label className="campo">
              População
              <input type="number" name="populacao" min="0" step="1" value={edicao.dados.populacao} onChange={alterarDado} />
            </label>
            <label className="campo">
              IDH
              <input type="number" name="idh" min="0" max="1" step="0.001" value={edicao.dados.idh} onChange={alterarDado} />
            </label>
            <label className="campo">
              Latitude
              <input type="number" name="latitude" min="-90" max="90" step="any" value={edicao.dados.latitude} onChange={alterarDado} />
            </label>
            <label className="campo">
              Longitude
              <input type="number" name="longitude" min="-180" max="180" step="any" value={edicao.dados.longitude} onChange={alterarDado} />
            </label>
          </div>

          <h4>Indicadores</h4>
          <div className="grade-formulario">
            <label className="campo">
              Ano de referência *
              <input
                type="number"
                min="1900"
                max="2100"
                step="1"
                value={edicao.ano}
                onChange={(e) => setEdicao({ ...edicao, ano: e.target.value })}
                required
              />
            </label>
            {criterios.map((c) => (
              <label className="campo" key={c.id}>
                {c.codigo} · {c.nome}
                {c.unidade ? ` (${c.unidade})` : ""}
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={edicao.valores[c.id]}
                  onChange={(e) => alterarValor(c.id, e.target.value)}
                />
              </label>
            ))}
          </div>

          <div className="acoes">
            <button type="submit" className="botao" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </button>
            <button type="button" className="botao secundario" onClick={() => setEdicao(null)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <section className="panel">
        <div className="linha-filtros">
          <label className="campo campo-inline">
            Buscar
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome ou UF" />
          </label>
          <label className="campo campo-inline">
            Ano de referência
            <select value={ano} onChange={(e) => carregar(e.target.value)}>
              {!matriz.anos.includes(Number(ano)) && <option value={ano}>{ano}</option>}
              {matriz.anos.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>

        {municipios.length === 0 ? (
          <Vazio>Nenhum município encontrado.</Vazio>
        ) : (
          <div className="table-container">
            <table className="tabela-compacta">
              <thead>
                <tr>
                  <th>Município</th>
                  <th>UF</th>
                  <th>População</th>
                  <th>IDH</th>
                  {criterios.map((c) => (
                    <th key={c.id} title={`${c.nome}${c.unidade ? ` (${c.unidade})` : ""}`}>{c.codigo}</th>
                  ))}
                  {podeEditar && <th />}
                </tr>
              </thead>
              <tbody>
                {municipios.map((m) => (
                  <tr key={m.id}>
                    <td>{m.nome}</td>
                    <td>{m.uf}</td>
                    <td>{formatarNumero(m.populacao, 0)}</td>
                    <td>{formatarNumero(m.idh, 3)}</td>
                    {criterios.map((c) => (
                      <td key={c.id}>{formatarNumero(m.valores[c.id], 4)}</td>
                    ))}
                    {podeEditar && (
                      <td className="celula-acoes">
                        <button type="button" className="botao-link" onClick={() => abrirEdicao(m)}>
                          Editar
                        </button>
                        {ehAdmin && (
                          <button type="button" className="botao-link perigo" onClick={() => excluir(m)}>
                            Excluir
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="texto-suave">
          Passe o mouse sobre o código para ver o nome do critério. "—" indica indicador não informado no ano.
        </p>
      </section>
    </>
  );
}

export default MunicipiosPage;
