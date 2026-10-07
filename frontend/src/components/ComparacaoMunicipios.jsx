import { useState } from "react";
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { formatarNumero, nomeTipo } from "../utils/formatacao";

const CORES = ["#0f766e", "#2563eb", "#d97706", "#9333ea"];
const MAXIMO = 4;

// Desempenho de 0 a 1 em cada critério (1 = melhor valor entre os municípios).
// Benefício: (v - min) / (max - min). Custo: (max - v) / (max - min).
function desempenho(valor, valores, tipo) {
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);

  if (maximo === minimo) return 1;

  return tipo === "beneficio"
    ? (valor - minimo) / (maximo - minimo)
    : (maximo - valor) / (maximo - minimo);
}

function ComparacaoMunicipios({ municipios, criterios }) {
  const comDados = municipios.filter((m) => Object.keys(m.valores ?? {}).length > 0);
  const [selecionados, setSelecionados] = useState(() =>
    comDados.slice(0, 3).map((m) => m.id)
  );

  if (comDados.length < 2 || criterios.length === 0) {
    return <p className="texto-suave">É preciso ao menos 2 municípios com indicadores para comparar.</p>;
  }

  const escolhidos = comDados.filter((m) => selecionados.includes(m.id));

  const dados = criterios.map((criterio) => {
    const valores = comDados
      .map((m) => m.valores[criterio.id])
      .filter((v) => v !== undefined);

    const linha = { criterio: criterio.codigo ?? criterio.nome };

    escolhidos.forEach((m) => {
      const valor = m.valores[criterio.id];
      linha[m.nome] =
        valor === undefined ? 0 : Number(desempenho(valor, valores, criterio.tipo).toFixed(3));
    });

    return linha;
  });

  function alternar(id) {
    setSelecionados((atuais) =>
      atuais.includes(id)
        ? atuais.filter((item) => item !== id)
        : atuais.length < MAXIMO
          ? [...atuais, id]
          : atuais
    );
  }

  return (
    <div className="comparacao">
      <div className="chips" role="group" aria-label="Municípios para comparar">
        {comDados.map((m) => (
          <button
            type="button"
            key={m.id}
            className={`chip ${selecionados.includes(m.id) ? "ativo" : ""}`}
            onClick={() => alternar(m.id)}
            aria-pressed={selecionados.includes(m.id)}
          >
            {m.nome} - {m.uf}
          </button>
        ))}
      </div>
      <p className="texto-suave">
        Selecione até {MAXIMO} municípios. Cada eixo mostra o desempenho relativo no critério
        (1 = melhor valor, já considerando se o critério é de benefício ou custo).
      </p>

      {escolhidos.length > 0 && (
        <>
          <ResponsiveContainer width="100%" height={360}>
            <RadarChart data={dados} outerRadius="72%">
              <PolarGrid />
              <PolarAngleAxis dataKey="criterio" />
              <PolarRadiusAxis domain={[0, 1]} tickCount={3} />
              {escolhidos.map((m, i) => (
                <Radar
                  key={m.id}
                  name={m.nome}
                  dataKey={m.nome}
                  stroke={CORES[i % CORES.length]}
                  fill={CORES[i % CORES.length]}
                  fillOpacity={0.15}
                />
              ))}
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Critério</th>
                  <th>Tipo</th>
                  {escolhidos.map((m) => (
                    <th key={m.id}>{m.nome}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {criterios.map((criterio) => (
                  <tr key={criterio.id}>
                    <td>
                      <strong>{criterio.codigo}</strong> {criterio.nome}
                      {criterio.unidade ? ` (${criterio.unidade})` : ""}
                    </td>
                    <td>{nomeTipo(criterio.tipo)}</td>
                    {escolhidos.map((m) => (
                      <td key={m.id}>{formatarNumero(m.valores[criterio.id], 4)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default ComparacaoMunicipios;
