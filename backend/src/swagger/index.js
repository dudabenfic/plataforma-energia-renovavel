const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");
const { env } = require("../config/env");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Plataforma de Energia Renovável",
      version: "1.0.0",
      description:
        "API para análise multicritério de vulnerabilidade social energética " +
        "utilizando o método TOPSIS com os critérios C1 a C7.\n\n" +
        "Para acessar as rotas protegidas, faça login em **POST /api/auth/login**, " +
        "copie o `token` e informe-o no botão **Authorize**."
    },
    servers: [
      { url: "/", description: "Servidor atual" },
      { url: `http://localhost:${env.PORT}`, description: "Desenvolvimento local" }
    ],
    tags: [
      { name: "Status" },
      { name: "Autenticação" },
      { name: "Usuários" },
      { name: "Municípios" },
      { name: "Critérios" },
      { name: "Indicadores" },
      { name: "TOPSIS" },
      { name: "Simulações" },
      { name: "Relatórios" },
      { name: "Importação" }
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
      },
      responses: {
        NaoAutenticado: {
          description: "Token ausente, inválido ou expirado",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Erro" },
              example: { sucesso: false, erro: "Token de autenticação não informado." }
            }
          }
        },
        SemPermissao: {
          description: "Perfil sem permissão para a operação",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Erro" },
              example: { sucesso: false, erro: "Seu perfil não tem permissão para esta operação." }
            }
          }
        },
        DadosInvalidos: {
          description: "Dados inválidos",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Erro" } } }
        },
        NaoEncontrado: {
          description: "Registro não encontrado",
          content: { "application/json": { schema: { $ref: "#/components/schemas/Erro" } } }
        },
        ErroInterno: {
          description: "Erro interno do servidor",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Erro" },
              example: { sucesso: false, erro: "Erro interno do servidor." }
            }
          }
        }
      },
      schemas: {
        Erro: {
          type: "object",
          properties: {
            sucesso: { type: "boolean", example: false },
            erro: { type: "string" },
            erros: {
              type: "array",
              description: "Detalhes (ex.: erros por linha na importação)",
              items: { type: "object" }
            }
          }
        },
        Usuario: {
          type: "object",
          properties: {
            id: { type: "integer", example: 2 },
            nome: { type: "string", example: "Maria" },
            email: { type: "string", example: "maria@email.com" },
            perfil: { type: "string", enum: ["admin", "pesquisador", "gestor"] },
            ativo: { type: "boolean" },
            created_at: { type: "string", format: "date-time" }
          }
        },
        Municipio: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            nome: { type: "string", example: "Município A" },
            uf: { type: "string", example: "BA" },
            populacao: { type: "integer", example: 100000 },
            idh: { type: "number", example: 0.7 },
            latitude: { type: "number", example: -12.9711 },
            longitude: { type: "number", example: -38.5014 }
          }
        },
        MunicipioEntrada: {
          type: "object",
          required: ["nome", "uf"],
          properties: {
            nome: { type: "string", example: "Município D" },
            uf: { type: "string", example: "BA" },
            populacao: { type: "integer", example: 50000 },
            idh: { type: "number", example: 0.65 },
            latitude: { type: "number", example: -12.5 },
            longitude: { type: "number", example: -39.1 }
          }
        },
        Criterio: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            codigo: { type: "string", example: "C1" },
            nome: { type: "string", example: "% domicílios sem acesso à eletricidade" },
            descricao: { type: "string" },
            tipo: { type: "string", enum: ["beneficio", "custo"] },
            peso: { type: "number", example: 0.2 },
            unidade: { type: "string", example: "%" },
            fonte: { type: "string", example: "IBGE" },
            ativo: { type: "boolean" }
          }
        },
        CriterioEntrada: {
          type: "object",
          required: ["nome", "tipo"],
          properties: {
            codigo: { type: "string", example: "C8" },
            nome: { type: "string", example: "Novo indicador" },
            descricao: { type: "string" },
            tipo: { type: "string", enum: ["beneficio", "custo"] },
            peso: { type: "number", example: 0 },
            unidade: { type: "string" },
            fonte: { type: "string" }
          }
        },
        Indicador: {
          type: "object",
          properties: {
            id: { type: "integer" },
            municipio_id: { type: "integer", example: 1 },
            criterio_id: { type: "integer", example: 1 },
            valor: { type: "number", example: 15 },
            ano_referencia: { type: "integer", example: 2026 }
          }
        },
        ResultadoTopsis: {
          type: "object",
          properties: {
            posicao: { type: "integer", example: 1 },
            indice: { type: "integer", example: 1 },
            municipio_id: { type: "integer", example: 2 },
            municipio: { type: "string", example: "Município B" },
            uf: { type: "string", example: "BA" },
            ci: { type: "number", example: 1 },
            distanciaPositiva: { type: "number", example: 0 },
            distanciaNegativa: { type: "number", example: 0.2252 },
            latitude: { type: "number" },
            longitude: { type: "number" }
          }
        },
        Simulacao: {
          type: "object",
          properties: {
            id: { type: "integer", example: 74 },
            usuario_id: { type: "integer", nullable: true, example: 2 },
            usuario: {
              type: "object",
              nullable: true,
              properties: { id: { type: "integer" }, nome: { type: "string" } }
            },
            data_execucao: { type: "string", format: "date-time" },
            status: { type: "string", enum: ["concluida", "erro", "processando"] },
            parametros: {
              type: "object",
              example: {
                pesos: [0.2, 0.2, 0.15, 0.25, 0.2, 0, 0],
                tipos: ["custo", "beneficio", "beneficio", "custo", "beneficio", "custo", "beneficio"],
                ano_referencia: 2026,
                municipio_ids: [1, 2, 3]
              }
            }
          }
        },
        ResultadoRanking: {
          type: "object",
          properties: {
            id: { type: "integer" },
            simulacao_id: { type: "integer" },
            municipio_id: { type: "integer" },
            municipio: { type: "string" },
            uf: { type: "string" },
            coeficiente_ci: { type: "number" },
            distancia_positiva: { type: "number" },
            distancia_negativa: { type: "number" },
            posicao: { type: "integer" }
          }
        }
      }
    }
  },
  apis: [path.join(__dirname, "../app.js"), path.join(__dirname, "../routes/*.js")]
};

module.exports = swaggerJsdoc(options);
