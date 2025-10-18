#!/bin/bash

# Script para build e push da imagem completa
# Execute: chmod +x build-and-push.sh && ./build-and-push.sh

set -e

# Configurações
IMAGE_NAME="alesantos175/scrapping"
VERSION="5.0"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Maps Scraper Pro - Build Script      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"

# Verificar se está na raiz do projeto
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Erro: Execute este script na raiz do projeto${NC}"
    echo "Estrutura esperada:"
    echo "  ├── backend/"
    echo "  ├── frontend/"
    echo "  ├── nginx/"
    echo "  ├── Dockerfile"
    echo "  └── build-and-push.sh"
    exit 1
fi

echo -e "\n${YELLOW}📦 Versão: ${VERSION}${NC}"
echo -e "${YELLOW}🐳 Imagem: ${IMAGE_NAME}:${VERSION}${NC}\n"

# Limpar builds anteriores
echo -e "\n${YELLOW}🧹 Limpando cache...${NC}"
rm -rf frontend/dist
rm -rf frontend/node_modules/.vite

# 1. Build da imagem
echo -e "\n${BLUE}════════════════════════════════════════${NC}"
echo -e "${YELLOW}🔨 Iniciando build da imagem...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

docker build \
  --no-cache \
  .

if [ $? -ne 0 ]; then
    echo -e "\n${RED}❌ Erro no build da imagem${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ Build concluído com sucesso!${NC}"

# Criar tag 'latest'
echo -e "\n${YELLOW}🏷️  Criando tag 'latest'...${NC}"
docker tag ${IMAGE_NAME}:${VERSION} ${IMAGE_NAME}:latest

# 2. Login no Docker Hub
echo -e "\n${BLUE}════════════════════════════════════════${NC}"
echo -e "${YELLOW}🔐 Login no Docker Hub...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

docker login

if [ $? -ne 0 ]; then
    echo -e "\n${RED}❌ Erro no login do Docker Hub${NC}"
    exit 1
fi

# 3. Push da imagem
echo -e "\n${BLUE}════════════════════════════════════════${NC}"
echo -e "${YELLOW}📤 Enviando imagem para Docker Hub...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}Enviando ${IMAGE_NAME}:${VERSION}...${NC}"
docker push ${IMAGE_NAME}:${VERSION}

echo -e "\n${YELLOW}Enviando ${IMAGE_NAME}:latest...${NC}"
docker push ${IMAGE_NAME}:latest

if [ $? -ne 0 ]; then
    echo -e "\n${RED}❌ Erro ao enviar imagem${NC}"
    exit 1
fi

# 4. Resumo
echo -e "\n${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         ✅ BUILD CONCLUÍDO!           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}\n"

echo -e "${BLUE}📦 Imagens criadas:${NC}"
echo -e "   • ${IMAGE_NAME}:${VERSION}"
echo -e "   • ${IMAGE_NAME}:latest"

echo -e "\n${BLUE}🚀 Próximos passos no servidor:${NC}"
echo -e "${YELLOW}"
echo -e "${NC}"

echo -e "\n${BLUE}🌐 URL de acesso:${NC}"
echo -e "   ${YELLOW}https://scrapping.apsolutions.ia.br${NC}"

echo -e "\n${GREEN}Happy Deploying! 🎉${NC}\n"