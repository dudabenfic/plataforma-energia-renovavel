import { useEffect, useState } from "react";
import api, { mensagemDeErro } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { navegar } from "../hooks/useHashRoute";
import { Alerta, Carregando } from "../components/Feedback";
import { formatarPercentual, nomeTipo } from "../utils/formatacao";

const NOVO = { codigo: "", nome: "", tipo: "beneficio", unidade: "", fonte: "", descricao: "" };

// RF02 — critérios/indicadores de vulnerabilidade (tipo, unidade, fonte).
function CriteriosPage() {
  const { podeEditar, ehAdmin } = useAuth();
  const [criterios, setCriterios] = useState(null);
  const [edicao, setEdicao] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    api
      .get("/criterios")
      .then(({ data }) => setCriterios(data.criterios))
      .catch((error) => setErro(mensagemDeErro(error, "Não foi possível carregar os critérios.")));
  }, [versao]);

  const recarregar = () => setVersao((v) => v + 1);

  if (!criterios) return erro ? <Alerta>{erro}</Alerta> : <Carregando />;

  function alterar(evento) {
    setEdicao({ ...edicao, [evento.target.name]: evento.target.value });
  }

  async function salvar(evento) {
    evento.preventDefault();
    setSalvando(true);
    setErro("");

    const { id, codigo, nome, tipo, unidade, fonte, descricao } = edicao;

    try {
      if (id) {
        await api.put(`/criterios/${id}`, { nome, tipo, unidade, fonte, descricao });
      } else {
        await api.post("/criterios", { codigo, nome, tipo, unidade, fonte, descricao, peso: 0 });
      }

      setAviso("Critério salvo com sucesso.");
      setEdicao(null);
      recarregar();
    } catch (error) {
      setErro(mensagemDeErro(error));
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtivo(criterio) {
    const acao = criterio.ativo ? "desativar" : "reativar";

    if (!window.confirm(`Deseja ${acao} o critério ${criterio.codigo ?? criterio.nome}?`)) return;

    try {
      if (criterio.ativo) {
        await api.delete(`/criterios/${criterio.id}`);
      } else {
        await api.put(`/criterios/${criterio.id}`, { ativo: true });
      }

      setAviso(
        criterio.ativo
          ? "Critério desativado. Ajuste os pesos para que a soma volte a 100%."
          : "Critério reativado. Ajuste os pesos na tela de simulação."
      );
      recarregar();
    } catch (error) {
      setErro(mensagemDeErro(error));
    }
  }

  return (
    <>
      <div className="titulo-pagina">
        <div>
          <h2>Critérios</h2>
          <p>
            Indicadores de vulnerabilidade social energética. Critérios de <strong>benefício</strong>:
            maior é melhor. Critérios de <strong>custo</strong>: menor é melhor.
          </p>
        </div>
        <div className="acoes">
          <button type="button" className="botao secundario" onClick={() => navegar("simulacao")}>
            Configurar pesos
          </button>
          {ehAdmin && (
            <button type="button" className="botao" onClick={() => setEdicao({ ...NOVO })}>
              Novo critério
            </button>
          )}
        </div>
      </div>

      <Alerta aoFechar={() => setErro("")}>{erro}</Alerta>
      <Alerta tipo="sucesso" aoFechar={() => setAviso("")}>{aviso}</Alerta>

      {edicao && (
        <form className="panel" onSubmit={salvar}>
          <h3>{edicao.id ? `Editar ${edicao.codigo ?? "critério"}` : "Novo critério"}</h3>
          <div className="grade-formulario">
            {!edicao.id && (
              <label className="campo">
                Código
                <input name="codigo" value={edicao.codigo} onChange={alterar} maxLength={10} placeholder="Ex.: C8" />
              </label>
            )}
            <label className="campo">
              Nome *
              <input name="nome" value={edicao.nome} onChange={alterar} required maxLength={150} />
            </label>
            <label className="campo">
              Tipo *
              <select name="tipo" value={edicao.tipo} onChange={alterar}>
                <option value="beneficio">Benefício (maior é melhor)</option>
                <option value="custo">Custo (menor é melhor)</option>
              </select>
            </label>
            <label className="campo">
              Unidade
              <input name="unidade" value={edicao.unidade ?? ""} onChange={alterar} maxLength={50} />
            </label>
            <label className="campo">
              Fonte
              <input name="fonte" value={edicao.fonte ?? ""} onChange={alterar} maxLength={100} placeholder="IBGE, ANEEL, INPE..." />
            </label>
            <label className="campo campo-largo">
              Descrição
              <textarea name="descricao" value={edicao.descricao ?? ""} onChange={alterar} rows={2} />
            </label>
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
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Indicador</th>
                <th>Tipo</th>
                <th>Unidade</th>
                <th>Fonte</th>
                <th>Peso padrão</th>
                <th>Situação</th>
                {podeEditar && <th />}
              </tr>
            </thead>
            <tbody>
              {criterios.map((c) => (
                <tr key={c.id} className={c.ativo ? "" : "inativo"}>
                  <td><strong>{c.codigo ?? "—"}</strong></td>
                  <td>
                    {c.nome}
                    {c.descricao && <small className="descricao">{c.descricao}</small>}
                  </td>
                  <td><span className={`tipo tipo-${c.tipo}`}>{nomeTipo(c.tipo)}</span></td>
                  <td>{c.unidade ?? "—"}</td>
                  <td>{c.fonte ?? "—"}</td>
                  <td>{formatarPercentual(c.peso, 1)}</td>
                  <td>{c.ativo ? "Ativo" : "Inativo"}</td>
                  {podeEditar && (
                    <td className="celula-acoes">
                      <button type="button" className="botao-link" onClick={() => setEdicao({ ...c })}>
                        Editar
                      </button>
                      {ehAdmin && (
                        <button type="button" className="botao-link perigo" onClick={() => alternarAtivo(c)}>
                          {c.ativo ? "Desativar" : "Reativar"}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export default CriteriosPage;
