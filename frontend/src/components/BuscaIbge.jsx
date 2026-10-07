import { useEffect, useState } from "react";
import { dadosDoMunicipio, listarEstados, listarMunicipiosDaUf } from "../services/ibge";
import { Alerta } from "./Feedback";

// Busca o município na base do IBGE e preenche nome, UF, população
// estimada e coordenadas do formulário de cadastro.
function BuscaIbge({ aoSelecionar }) {
  const [estados, setEstados] = useState([]);
  const [uf, setUf] = useState("");
  const [municipios, setMunicipios] = useState([]);
  const [codigo, setCodigo] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    listarEstados()
      .then(setEstados)
      .catch(() => setErro("Não foi possível acessar a base do IBGE. Preencha os dados manualmente."));
  }, []);

  async function escolherUf(sigla) {
    setUf(sigla);
    setCodigo("");
    setMunicipios([]);

    if (!sigla) return;

    try {
      setMunicipios(await listarMunicipiosDaUf(sigla));
    } catch {
      setErro("Não foi possível carregar os municípios do IBGE.");
    }
  }

  async function preencher() {
    const municipio = municipios.find((m) => String(m.codigo) === codigo);
    if (!municipio) return;

    setBuscando(true);
    setErro("");

    const { populacao, coordenadas } = await dadosDoMunicipio(municipio.codigo);

    aoSelecionar({
      nome: municipio.nome,
      uf,
      populacao: populacao ?? "",
      latitude: coordenadas?.latitude ?? "",
      longitude: coordenadas?.longitude ?? ""
    });

    if (populacao === null || !coordenadas) {
      setErro("Alguns dados não foram encontrados; complete os campos vazios.");
    }

    setBuscando(false);
  }

  return (
    <div className="busca-ibge">
      <strong>Buscar no IBGE</strong>
      <div className="linha-filtros">
        <label className="campo campo-inline">
          UF
          <select value={uf} onChange={(e) => escolherUf(e.target.value)}>
            <option value="">Selecione</option>
            {estados.map((e) => (
              <option key={e.sigla} value={e.sigla}>{e.sigla} - {e.nome}</option>
            ))}
          </select>
        </label>
        <label className="campo campo-inline">
          Município
          <select value={codigo} onChange={(e) => setCodigo(e.target.value)} disabled={!uf}>
            <option value="">Selecione</option>
            {municipios.map((m) => (
              <option key={m.codigo} value={m.codigo}>{m.nome}</option>
            ))}
          </select>
        </label>
        <button type="button" className="botao secundario" onClick={preencher} disabled={!codigo || buscando}>
          {buscando ? "Buscando..." : "Preencher dados"}
        </button>
      </div>
      <p className="texto-suave">
        Preenche nome, UF, população estimada (IBGE) e coordenadas da sede municipal.
      </p>
      <Alerta tipo="aviso" aoFechar={() => setErro("")}>{erro}</Alerta>
    </div>
  );
}

export default BuscaIbge;
