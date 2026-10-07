# Etapa 1: build da aplicação React
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
# O Cypress (testes) não é necessário na imagem.
ENV CYPRESS_INSTALL_BINARY=0
RUN npm ci

COPY . .

ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Etapa 2: arquivos estáticos servidos pelo Nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
