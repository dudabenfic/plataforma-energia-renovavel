import { faixaVulnerabilidade, formatarCi } from "../utils/formatacao";

function RankingTable({ ranking }) {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Posição</th>
            <th>Município</th>
            <th>UF</th>
            <th title="Coeficiente de proximidade">Ci</th>
            <th title="Distância à solução ideal positiva">D+</th>
            <th title="Distância à solução ideal negativa">D-</th>
            <th>Vulnerabilidade</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((item) => {
            const faixa = faixaVulnerabilidade(item.ci);

            return (
              <tr key={item.municipio_id ?? item.posicao}>
                <td>{item.posicao}º</td>
                <td>{item.municipio}</td>
                <td>{item.uf}</td>
                <td><strong>{formatarCi(item.ci)}</strong></td>
                <td>{formatarCi(item.distanciaPositiva)}</td>
                <td>{formatarCi(item.distanciaNegativa)}</td>
                <td>
                  <span className="etiqueta" style={{ background: faixa.cor }}>
                    {faixa.rotulo.replace("Vulnerabilidade ", "")}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default RankingTable;
