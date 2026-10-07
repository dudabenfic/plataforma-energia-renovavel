import {
  MapContainer,
  TileLayer,
  Marker,
  Popup
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function MapView({ municipios, ranking }) {
  const centro = [-14.235, -51.9253];

  const rankingPorMunicipio = {};

  ranking.forEach((resultado) => {
    const municipio = municipios[resultado.indice];

    rankingPorMunicipio[municipio.id] = resultado;
  });

  return (
    <MapContainer
      center={centro}
      zoom={4}
      style={{ height: "500px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {municipios.map((municipio) => (
        <Marker
          key={municipio.id}
          position={[
            Number(municipio.latitude),
            Number(municipio.longitude)
          ]}
        >
          <Popup>
            <strong>{municipio.nome}</strong>
            <br />
            Estado: {municipio.uf}
            <br />
            População: {municipio.populacao}
            <br />
            IDH: {municipio.idh}
            <br />
            <br />
            <strong>
              Posição no ranking:{" "}
              {rankingPorMunicipio[municipio.id]?.posicao}º
            </strong>
            <br />
            Coeficiente TOPSIS:{" "}
            {rankingPorMunicipio[municipio.id]?.ci.toFixed(4)}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default MapView;