# Diagramas UML

Os diagramas usam [Mermaid](https://mermaid.js.org/) e são exibidos diretamente pelo GitHub.

## Casos de uso

```mermaid
flowchart LR
    Admin([Administrador])
    Pesq([Pesquisador])
    Gestor([Gestor Público])

    UC01[UC01 Cadastrar município]
    UC02[UC02 Configurar critérios e pesos]
    UC03[UC03 Executar TOPSIS]
    UC04[UC04 Gerar relatório PDF/CSV]
    UC05[UC05 Importar dados CSV]
    UC06[UC06 Consultar histórico]
    UC07[UC07 Gerenciar usuários e perfis]
    UC08[UC08 Visualizar dashboard e mapa]

    Admin --> UC01 & UC02 & UC05 & UC07
    Pesq --> UC01 & UC02 & UC03 & UC05
    Gestor --> UC03 & UC04
    Pesq --> UC04 & UC06 & UC08
    Gestor --> UC06 & UC08
```

Pré-condição de todos os casos de uso: usuário autenticado.

## Classes (modelo de dados)

```mermaid
classDiagram
    class Usuario {
        id: int
        nome: string
        email: string
        senha_hash: string
        perfil: admin | pesquisador | gestor
        ativo: bool
    }
    class Municipio {
        id: int
        nome: string
        uf: char(2)
        populacao: int
        idh: decimal
        coordenadas: geometry(Point, 4326)
        latitude: decimal
        longitude: decimal
    }
    class Criterio {
        id: int
        codigo: string
        nome: string
        tipo: beneficio | custo
        peso: decimal
        unidade: string
        fonte: string
        ativo: bool
    }
    class MatrizDecisao {
        municipio_id: FK
        criterio_id: FK
        valor: decimal
        ano_referencia: int
    }
    class Simulacao {
        id: int
        usuario_id: FK
        data_execucao: datetime
        parametros: JSON
        status: string
    }
    class ResultadoRanking {
        simulacao_id: FK
        municipio_id: FK
        coeficiente_ci: decimal
        distancia_positiva: decimal
        distancia_negativa: decimal
        posicao: int
    }

    Municipio "1" --> "*" MatrizDecisao
    Criterio "1" --> "*" MatrizDecisao
    Usuario "1" --> "*" Simulacao
    Simulacao "1" --> "*" ResultadoRanking
    Municipio "1" --> "*" ResultadoRanking
```

## Sequência — executar TOPSIS

```mermaid
sequenceDiagram
    actor P as Pesquisador
    participant F as Frontend
    participant A as API (rotas + middleware)
    participant S as TopsisService
    participant D as Domínio TOPSIS
    participant DB as Supabase

    P->>F: Clica "Executar TOPSIS"
    F->>A: POST /api/topsis/executar {pesos, ano_referencia, municipio_ids} + Bearer JWT
    A->>A: Valida token e carrega usuário
    A->>S: executar(dados, usuario)
    S->>DB: critérios ativos, municípios, matriz de decisão
    DB-->>S: dados
    S->>D: topsis(matriz, pesos, tipos)
    D->>D: normalizar → ponderar → A+ / A- → distâncias → Ci → ordenar
    D-->>S: ranking
    S->>DB: salvar simulação (usuario_id) e resultados
    DB-->>S: confirmação
    S-->>A: ranking + metadados
    A-->>F: 200 OK {simulacao, ranking, criterios, pesos}
    F-->>P: Tabela, gráfico e mapa do ranking
```

## Atividades — fluxo TOPSIS

```mermaid
flowchart TD
    I((Início)) --> A[Selecionar municípios]
    A --> B[Definir pesos dos critérios]
    B --> C{Soma = 100%?}
    C -- Não --> B
    C -- Sim --> D[Montar matriz de decisão]
    D --> E[Normalização vetorial]
    E --> F[Matriz ponderada]
    F --> G[Solução ideal positiva A+]
    F --> H[Solução ideal negativa A-]
    G --> J[Distância euclidiana a A+]
    H --> K[Distância euclidiana a A-]
    J --> L[Ci = D- / D+ + D-]
    K --> L
    L --> M[Ordenar por Ci]
    M --> N[Salvar simulação e exibir resultados]
    N --> X((Fim))
```

## Componentes

```mermaid
flowchart TB
    subgraph Frontend [Frontend - React SPA]
        Dash[Dashboard] --- Mapa[Mapa Leaflet] --- Forms[Formulários] --- Rel[Relatórios PDF/CSV]
    end
    subgraph Backend [Backend - API Express]
        Auth[Auth JWT/bcrypt] --- Engine[TOPSIS Engine] --- Import[Importação CSV]
    end
    DB[(PostgreSQL + PostGIS - Supabase)]

    Frontend -- REST/JSON --> Backend
    Backend -- SQL --> DB
```

## Implantação

```mermaid
flowchart LR
    Browser[Navegador] -- HTTPS --> Vercel[Vercel - frontend estático]
    Browser -- HTTPS / JWT --> Render[Render - API Node.js]
    Render -- HTTPS --> Supabase[(Supabase - PostgreSQL + PostGIS)]
```
