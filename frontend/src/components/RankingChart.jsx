import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { faixaVulnerabilidade, formatarCi } from "../utils/formatacao";

function RankingChart({ ranking }) {
  const dados = ranking.map((item) => ({
    nome: `${item.posicao}º ${item.municipio}`,
    ci: Number(item.ci.toFixed(4))
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(260, Math.min(dados.length * 36, 600))}>
      <BarChart data={dados} layout="vertical" margin={{ left: 10, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" domain={[0, 1]} tickCount={6} />
        <YAxis type="category" dataKey="nome" width={150} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(valor) => [formatarCi(valor), "Coeficiente Ci"]} />
        <Bar dataKey="ci" name="Coeficiente Ci" radius={[0, 4, 4, 0]}>
          {dados.map((item) => (
            <Cell key={item.nome} fill={faixaVulnerabilidade(item.ci).cor} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default RankingChart;
