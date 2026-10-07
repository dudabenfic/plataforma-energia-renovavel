import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  CircleMarker,
  Popup,
  useMap
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { FAIXAS, faixaVulnerabilidade, formatarCi, formatarNumero, nomeTipo } from "../utils/formatacao";
import { desempenho } from "../utils/indicadores";

// Corrige os ícones padrão do Leaflet no build do Vite.
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const CENTRO_BRASIL = [-14.235, -51.9253];

// Cores da camada por indicador (pior, intermediário, melhor desempenho).
const FAIXAS_INDICADOR = [
  { rotulo: "Pior desempenho no critério", minimo: 0, cor: FAIXAS[0].cor },
  { rotulo: "Intermediário", minimo: 1 / 3, cor: FAIXAS[1].cor },
  { rotulo: "Melhor desempenho no critério", minimo: 2 / 3, cor: FAIXAS[2].cor }
];

function corDoDesempenho(valor) {
  return [...FAIXAS_INDICADOR].reverse().find((faixa) => valor >= faixa.minimo).cor;
}

function temCoordenadas(municipio) {
  return (
    municipio.latitude !== null &&
    municipio.latitude !== undefined &&
    municipio.longitude !== null &&
    municipio.longitude !== undefined &&
    Number.isFinite(Number(municipio.latitude)) &&
    Number.isFinite(Number(municipio.longitude))
  );
}

function AjustarEnquadramento({ pontos }) {
  const map = useMap();
  // Reenquadra apenas quando o conjunto de pontos muda.
  const chave = JSON.stringify(pontos);

  useEffect(() => {
    const pontos = JSON.parse(chave);

    // Sem animação: se o usuário trocar de página durante a animação,
    // o Leaflet tentaria mover um mapa já removido da tela.
    if (pontos.length === 1) {
      map.setView(pontos[0], 8, { animate: false });
    } else if (pontos.length > 1) {
      map.fitBounds(pontos, { padding: [40, 40], maxZoom: 9, animate: false });
    }
  }, [map, chave]);

  return null;
}

// RF07 — municípios no mapa. A camada "Ci" colore pela faixa de
// vulnerabilidade do ranking; as camadas C1 a C7 colorem pelo desempenho
// relativo no indicador (requer municípios com o campo "valores").
function MapView({ municipios = [], ranking = [], criterios = [], altura = 450 }) {
  const [camada, setCamada] = useState("ci");

  const rankingPorMunicipio = new Map(
    ranking.map((resultado) => [resultado.municipio_id, resultado])
  );

  const criterio = criterios.find((c) => String(c.id) === camada);
  const valoresDoCriterio = criterio
    ? municipios
        .map((m) => m.valores?.[criterio.id])
        .filter((v) => v !== undefined)
    : [];

  const comCoordenadas = municipios.filter(temCoordenadas);
  const semCoordenadas = municipios.length - comCoordenadas.length;
  const pontos = comCoordenadas.map((m) => [Number(m.latitude), Number(m.longitude)]);

  function corDoMunicipio(municipio) {
    if (criterio) {
      const valor = municipio.valores?.[criterio.id];
      return valor === undefined
        ? null
        : corDoDesempenho(desempenho(valor, valoresDoCriterio, criterio.tipo));
    }

    const resultado = rankingPorMunicipio.get(municipio.id);
    return resultado ? faixaVulnerabilidade(resultado.ci).cor : null;
  }

  const legenda = criterio
    ? FAIXAS_INDICADOR
    : ranking.length > 0
      ? FAIXAS
      : [];

  return (
    <div>
      {criterios.length > 0 && (
        <label className="campo campo-inline seletor-camada">
          Colorir por
          <select value={camada} onChange={(e) => setCamada(e.target.value)}>
            <option value="ci">Ci do ranking (vulnerabilidade)</option>
            {criterios.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.codigo} · {c.nome}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="mapa" style={{ height: altura }}>
        <MapContainer center={CENTRO_BRASIL} zoom={4} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <AjustarEnquadramento pontos={pontos} />

          {comCoordenadas.map((municipio) => {
            const resultado = rankingPorMunicipio.get(municipio.id);
            const posicao = [Number(municipio.latitude), Number(municipio.longitude)];
            const cor = corDoMunicipio(municipio);
            const valor = criterio ? municipio.valores?.[criterio.id] : undefined;

            const conteudo = (
              <Popup>
                <strong>{municipio.nome} - {municipio.uf}</strong>
                <br />
                População: {formatarNumero(municipio.populacao, 0)}
                {municipio.idh !== null && municipio.idh !== undefined && (
                  <>
                    <br />
                    IDH: {formatarNumero(municipio.idh, 3)}
                  </>
                )}
                {criterio && (
                  <>
                    <br />
                    <br />
                    <strong>{criterio.codigo} · {criterio.nome}</strong>
                    <br />
                    Valor: {formatarNumero(valor, 4)}
                    {criterio.unidade ? ` ${criterio.unidade}` : ""} ({nomeTipo(criterio.tipo)})
                  </>
                )}
                {resultado && (
                  <>
                    <br />
                    <br />
                    <strong>Posição no ranking: {resultado.posicao}º</strong>
                    <br />
                    Coeficiente Ci: {formatarCi(resultado.ci)}
                    <br />
                    {faixaVulnerabilidade(resultado.ci).rotulo}
                  </>
                )}
              </Popup>
            );

            if (!cor) {
              return (
                <Marker key={municipio.id} position={posicao}>
                  {conteudo}
                </Marker>
              );
            }

            return (
              <CircleMarker
                key={municipio.id}
                center={posicao}
                radius={11}
                pathOptions={{ color: "#ffffff", weight: 2, fillColor: cor, fillOpacity: 0.9 }}
              >
                {conteudo}
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      <div className="legenda">
        {legenda.map((faixa) => (
          <span key={faixa.rotulo}>
            <i style={{ background: faixa.cor }} /> {faixa.rotulo}
          </span>
        ))}
        {criterio && (
          <span className="texto-suave">
            {criterio.tipo === "beneficio" ? "Maior valor é melhor." : "Menor valor é melhor."}
          </span>
        )}
        {semCoordenadas > 0 && (
          <span className="texto-suave">
            {semCoordenadas} município(s) sem coordenadas não aparecem no mapa.
          </span>
        )}
      </div>
    </div>
  );
}

export default MapView;
