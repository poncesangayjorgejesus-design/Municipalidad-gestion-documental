FROM node:24-bookworm-slim AS interfaz
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --no-audit --no-fund
COPY client/ ./
RUN npm run build

FROM node:24-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY --chown=node:node server/src/ ./src/
COPY --chown=node:node server/ml/modelos/pesos.json ./ml/modelos/
COPY --from=interfaz --chown=node:node /app/client/build/ /app/client/dist/
USER node
EXPOSE 8000
CMD ["node", "src/index.js"]
