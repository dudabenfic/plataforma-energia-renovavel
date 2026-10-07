import { useEffect } from "react";
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

import { FAIXAS, faixaVulnerabilidade, formatarCi, formatarNumero } from "../utils/formatacao";

// Corrige os ícones padrão do Leaflet no build do Vite.
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const CENTRO_BRASIL = [-14.235, -51.9253];

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

    if (pontos.length === 1) {
      map.setView(pontos[0], 8);
    } else if (pontos.length > 1) {
      map.fitBounds(pontos, { padding: [40, 40], maxZoom: 9 });
    }
  }, [map, chave]);

  return null;
}

// RF07 — municípios no mapa, coloridos pela faixa de vulnerabilidade
// quando há resultado de ranking.
function MapView({ municipios = [], ranking = [], altura = 450 }) {
  const rankingPorMunicipio = new Map(
    ranking.map((resultado) => [resultado.municipio_id, resultado])
  );

  const comCoordenadas = municipios.filter(temCoordenadas);
  const semCoordenadas = municipios.length - comCoordenadas.length;
  const pontos = comCoordenadas.map((m) => [Number(m.latitude), Number(m.longitude)]);

  return (
    <div>
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

            const conteudo = (
              <Popup>
                <strong>{municipio.nome} - {municipio.uf}</strong>
                <br />
                População: {formatarNumero(municipio.populacao, 0)}
                <br />
                IDH: {formatarNumero(municipio.idh, 3)}
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

            if (!resultado) {
              return (
                <Marker key={municipio.id} position={posicao}>
                  {conteudo}
                </Marker>
              );
            }

            const cor = faixaVulnerabilidade(resultado.ci).cor;

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
        {ranking.length > 0 &&
          FAIXAS.map((faixa) => (
            <span key={faixa.chave}>
              <i style={{ background: faixa.cor }} /> {faixa.rotulo}
            </span>
          ))}
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
