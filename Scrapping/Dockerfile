# =============================
# Stage 1: Build Frontend
# =============================
FROM node:18-bullseye AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./

RUN npm run build

# =============================
# Stage 2: Backend + Nginx
# =============================
FROM node:18-bullseye

# Instalar Nginx, Chromium e dependências
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    nginx \
    chromium \
    chromium-sandbox \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    wget \
    curl \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Configurar Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production

# =============================
# Backend
# =============================
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm install
COPY backend/ ./

# =============================
# Frontend
# =============================
RUN rm -rf /usr/share/nginx/html/* && \
    rm -rf /var/www/html/*

COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html/

# =============================
# Nginx Config
# =============================
RUN rm -f /etc/nginx/sites-enabled/default && \
    rm -f /etc/nginx/conf.d/default.conf

COPY nginx/default.conf /etc/nginx/conf.d/default.conf

RUN nginx -t

# =============================
# Script de inicialização
# =============================
RUN printf '#!/bin/bash\n\
set -e\n\
\n\
echo "🚀 Maps Scraper Pro - Iniciando..."\n\
echo "================================"\n\
\n\
echo "🔧 Iniciando backend (porta 3001)..."\n\
cd /app/backend\n\
node server.js &\n\
BACKEND_PID=$!\n\
echo "✅ Backend iniciado (PID: $BACKEND_PID)"\n\
\n\
echo "⏳ Aguardando backend..."\n\
for i in {1..30}; do\n\
  if curl -sf http://localhost:3001/health > /dev/null 2>&1; then\n\
    echo "✅ Backend respondendo!"\n\
    break\n\
  fi\n\
  sleep 1\n\
done\n\
\n\
echo "🌐 Iniciando Nginx..."\n\
nginx -g "daemon off;" &\n\
NGINX_PID=$!\n\
echo "✅ Nginx iniciado (PID: $NGINX_PID)"\n\
\n\
echo "================================"\n\
echo "✅ Aplicação iniciada com sucesso!"\n\
echo "Backend: http://localhost:3001"\n\
echo "Frontend: http://localhost"\n\
echo "================================"\n\
\n\
wait $BACKEND_PID $NGINX_PID\n\
' > /start.sh && chmod +x /start.sh

# =============================
# Configurações finais
# =============================
WORKDIR /app

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

CMD ["/start.sh"]