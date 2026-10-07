# Plataforma de Energia Renovável

Sistema web para análise multicritério de vulnerabilidade energética em municípios, utilizando o método TOPSIS para gerar rankings a partir de diferentes indicadores relacionados ao acesso, uso e impacto da energia renovável.

## Sobre o projeto

O projeto foi desenvolvido como aplicação Full Stack acadêmica e tem como objetivo auxiliar na análise de vulnerabilidade energética por meio da combinação de diferentes critérios socioeconômicos e energéticos.

A aplicação permite:

- cadastrar e consultar dados de municípios;
- trabalhar com diferentes critérios de análise;
- configurar pesos dos critérios;
- executar o método TOPSIS;
- gerar ranking dos municípios;
- visualizar os resultados em gráficos;
- visualizar municípios em mapa;
- consultar o histórico de simulações;
- importar dados por arquivo CSV;
- exportar resultados em CSV;
- gerar relatório em PDF;
- consultar a documentação da API através do Swagger.

## Objetivo

Aplicar o método TOPSIS para realizar uma análise multicritério de vulnerabilidade energética, considerando indicadores classificados como critérios de benefício ou de custo.

O sistema calcula o desempenho relativo de cada município em relação à solução ideal positiva e à solução ideal negativa, produzindo um coeficiente de proximidade e uma posição no ranking.

## Arquitetura

O projeto está dividido em duas aplicações principais:

```text
plataforma-energia-renovavel/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── services/
│   │   ├── server.js
│   │   └── swagger.js
│   │
│   └── tests/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   └── ...
│
└── README.md

## 🛠️ Tecnologias utilizadas

### Frontend

- React
- Vite
- JavaScript
- CSS
- Axios
- Leaflet
- React Leaflet
- Recharts
- jsPDF
- jsPDF AutoTable
- FileSaver

### Backend

- Node.js
- Express
- JavaScript
- Supabase
- Multer
- csv-parse
- Swagger
- Jest
- Supertest

### Banco de dados

- PostgreSQL
- Supabase
- PostGIS

### Ferramentas

- Git
- GitHub
- Visual Studio Code
- npm

## 📊 Método TOPSIS

O sistema utiliza o método TOPSIS (Technique for Order Preference by Similarity to Ideal Solution).

O processo utilizado pela aplicação consiste em:

1. Montar a matriz de decisão;
2. Normalizar os valores;
3. Aplicar os pesos dos critérios;
4. Identificar a solução ideal positiva;
5. Identificar a solução ideal negativa;
6. Calcular as distâncias em relação às soluções ideais;
7. Calcular o coeficiente de proximidade;
8. Ordenar os municípios;
9. Gerar o ranking final.

O coeficiente TOPSIS varia entre 0 e 1. Quanto maior o coeficiente, maior a proximidade do município em relação à solução ideal positiva.

## 📌 Critérios utilizados

| Critério | Tipo | Unidade |
|---|---|---|
| Acesso à eletricidade | Custo | % |
| Energia solar instalada | Benefício | kW/hab |
| Renda per capita | Benefício | R$ |
| Tarifa de energia | Custo | R$/kWh |
| Irradiação solar | Benefício | kWh/m²/dia |

Os pesos podem ser configurados na interface antes da execução da simulação.

## 🗄️ Banco de dados

As principais tabelas utilizadas são:

### `municipios`

Armazena informações dos municípios, como nome, estado, população, IDH e coordenadas geográficas.

### `criterios`

Armazena os critérios utilizados no método TOPSIS, incluindo tipo e peso.

### `matriz_decisao`

Relaciona municípios e critérios com seus respectivos valores e ano de referência.

### `simulacoes`

Armazena o histórico das execuções do método TOPSIS.

### `resultados_ranking`

Armazena os resultados e posições obtidos por cada município em uma simulação.

## 🚀 Instalação

### Pré-requisitos

- Node.js
- npm
- Git

### 1. Clonar o projeto

```bash
git clone URL_DO_REPOSITORIO
cd plataforma-energia-renovavel
```

### 2. Instalar as dependências do backend

```bash
cd backend
npm install
```

### 3. Configurar as variáveis de ambiente

Crie um arquivo `.env` dentro da pasta `backend`:

```env
SUPABASE_URL=sua_url_do_supabase
SUPABASE_KEY=sua_chave_do_supabase
PORT=3001
```

> Nunca compartilhe ou versione o arquivo `.env`, pois ele contém as credenciais utilizadas pela aplicação.

### 4. Executar o backend

```bash
npm run dev
```

A API ficará disponível em:

```text
http://localhost:3001
```

### 5. Instalar as dependências do frontend

Abra outro terminal e execute:

```bash
cd frontend
npm install
```

### 6. Executar o frontend

```bash
npm run dev
```

A aplicação ficará disponível em:

```text
http://localhost:5173
```

## 📖 Documentação da API

Com o backend em execução, acesse:

```text
http://localhost:3001/api-docs
```

## 🔌 Principais endpoints

### `GET /`

Verifica se a API está funcionando.

### `POST /api/topsis/executar`

Executa o cálculo TOPSIS utilizando os dados dos municípios, critérios e matriz de decisão.

### `GET /api/simulacoes`

Consulta o histórico das simulações realizadas.

### `POST /api/importar-csv`

Importa dados de municípios e indicadores através de um arquivo CSV.

## 📥 Importação de dados

O arquivo CSV deve utilizar as seguintes colunas:

```text
nome
uf
populacao
idh
acesso_eletricidade
energia_solar
renda_per_capita
tarifa
irradiacao
ano
```

Exemplo:

```csv
nome,uf,populacao,idh,acesso_eletricidade,energia_solar,renda_per_capita,tarifa,irradiacao,ano
Municipio A,BA,100000,0.700,15,0.8,980,0.75,5.2,2026
Municipio B,BA,150000,0.800,5,2.1,1850,0.62,5.8,2026
Municipio C,BA,80000,0.600,22,0.3,650,0.89,4.9,2026
```

## 📤 Exportação

A aplicação permite exportar os resultados em:

- CSV;
- PDF.

## 🗺️ Visualização geográfica

A aplicação utiliza Leaflet para apresentar os municípios no mapa.

As informações exibidas incluem:

- Nome;
- Estado;
- População;
- IDH;
- Latitude;
- Longitude;
- Posição no ranking;
- Coeficiente TOPSIS.

## 📈 Visualização dos resultados

Após a execução do TOPSIS, o sistema apresenta:

- Ranking dos municípios;
- Coeficiente de proximidade;
- Posição de cada município;
- Comparação gráfica;
- Mapa geográfico;
- Histórico das simulações.

## 🧪 Testes

Os testes automatizados utilizam Jest e Supertest.

Para executar os testes:

```bash
cd backend
npm test
```

Para executar com cobertura:

```bash
npx jest --coverage
```

### Cobertura atual

- **83,22% de cobertura de statements**
- **83,21% de cobertura de linhas**
- **96,42% de cobertura de funções**
- **56,60% de cobertura de branches**

Testes atuais:

```text
Test Suites: 2 passed
Tests: 7 passed
```

## 🔐 Segurança

As credenciais do Supabase são armazenadas através de variáveis de ambiente e não devem ser versionadas no Git.

O arquivo `.env` deve permanecer fora do repositório.

## 📱 Responsividade

A interface possui estilos responsivos para diferentes tamanhos de tela, incluindo desktop, notebook, tablet e dispositivos móveis.

## ▶️ Fluxo de utilização

```text
Usuário
   ↓
Frontend
   ↓
Configuração dos pesos
   ↓
POST /api/topsis/executar
   ↓
Backend
   ↓
Consulta dos dados no Supabase
   ↓
Montagem da matriz de decisão
   ↓
Normalização
   ↓
Aplicação dos pesos
   ↓
Cálculo das soluções ideais
   ↓
Cálculo das distâncias
   ↓
Cálculo do coeficiente TOPSIS
   ↓
Ranking dos municípios
   ↓
Armazenamento da simulação
   ↓
Frontend
   ↓
Tabela + Gráfico + Mapa
```

## 📂 Estrutura do projeto

```text
plataforma-energia-renovavel/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.js
│   │   ├── services/
│   │   │   └── topsis.service.js
│   │   ├── server.js
│   │   └── swagger.js
│   │
│   ├── tests/
│   │   ├── api.test.js
│   │   └── topsis.test.js
│   │
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── MapView.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
└── README.md
```

## 📋 Funcionalidades

| Funcionalidade | Status |
|---|---|
| Configuração de pesos | ✅ |
| Cálculo TOPSIS | ✅ |
| Ranking dos municípios | ✅ |
| Dashboard | ✅ |
| Gráficos | ✅ |
| Mapa geográfico | ✅ |
| Histórico de simulações | ✅ |
| Importação CSV | ✅ |
| Exportação CSV | ✅ |
| Relatório PDF | ✅ |
| Documentação Swagger | ✅ |
| Testes automatizados | ✅ |
| Cobertura de testes ≥ 80% | ✅ |

## 👩‍💻 Desenvolvimento

Projeto acadêmico desenvolvido para a disciplina de Full Stack.

### Tecnologias principais

```text
React + Vite
        ↓
      Axios
        ↓
Node.js + Express
        ↓
Supabase / PostgreSQL
        ↓
Método TOPSIS
```

---

# Plataforma de Energia Renovável

Análise multicritério de vulnerabilidade energética utilizando o método TOPSIS.
