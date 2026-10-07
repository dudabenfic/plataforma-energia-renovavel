const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Plataforma de Energia Renovável",
      version: "1.0.0",
      description:
        "API para análise de vulnerabilidade energética utilizando o método TOPSIS."
    },
    servers: [
      {
        url: "http://localhost:3001"
      }
    ]
  },
  apis: ["./src/server.js"]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;