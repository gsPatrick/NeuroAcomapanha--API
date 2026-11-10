# API do MySessions. O relatório vira PDF pelo LibreOffice, por isso a imagem é Debian (não Alpine) e traz as fontes.
FROM node:24-bookworm-slim

ENV NODE_ENV=production

# LibreOffice (só o Writer) + fontes métricas compatíveis com Arial (o relatório usa Arial)
RUN apt-get update \
 && apt-get install -y --no-install-recommends libreoffice-writer fonts-liberation fonts-dejavu-core curl \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Relatórios gerados ficam aqui: monte um VOLUME persistente neste caminho (senão somem a cada deploy).
RUN mkdir -p /app/storage/reports && chown -R node:node /app
VOLUME ["/app/storage"]

USER node
EXPOSE 3333 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS "http://localhost:${PORT:-3333}${API_PREFIX:-/api}/health" || exit 1

# O healthcheck usa a PORT e o API_PREFIX configurados no ambiente.
# Aplica as migrações pendentes e sobe a API (a seed é um comando à parte: npm run seed).
CMD ["sh", "-c", "npm run migrate && node app.js"]
