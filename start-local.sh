#!/bin/bash

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

clear

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Maps Scraper Pro - Início Local      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"

# Verificar Node.js
echo -e "${YELLOW}🔍 Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado!${NC}"
    echo -e "${YELLOW}Instale em: https://nodejs.org/${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js instalado: ${NODE_VERSION}${NC}\n"

# Verificar se as pastas existem
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Erro: Pastas backend/frontend não encontradas${NC}"
    echo -e "${YELLOW}Execute este script na raiz do projeto!${NC}"
    exit 1
fi

# Instalar dependências se necessário
echo -e "${YELLOW}📦 Verificando dependências...${NC}"

if [ ! -d "backend/node_modules" ]; then
    echo -e "${BLUE}📥 Instalando dependências do backend...${NC}"
    cd backend && npm install && cd ..
    echo -e "${GREEN}✅ Backend instalado!${NC}\n"
else
    echo -e "${GREEN}✅ Backend já instalado${NC}\n"
fi

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${BLUE}📥 Instalando dependências do frontend...${NC}"
    cd frontend && npm install && cd ..
    echo -e "${GREEN}✅ Frontend instalado!${NC}\n"
else
    echo -e "${GREEN}✅ Frontend já instalado${NC}\n"
fi

# Verificar se as portas estão livres
echo -e "${YELLOW}🔍 Verificando portas...${NC}"

if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${RED}❌ Porta 3001 já está em uso!${NC}"
    echo -e "${YELLOW}Matando processo...${NC}"
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${RED}❌ Porta 5173 já está em uso!${NC}"
    echo -e "${YELLOW}Matando processo...${NC}"
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

echo -e "${GREEN}✅ Portas 3001 e 5173 disponíveis${NC}\n"

# Iniciar Backend
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${YELLOW}🚀 Iniciando Backend (porta 3001)...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

cd backend
node server.js &
BACKEND_PID=$!
cd ..

echo -e "${GREEN}✅ Backend iniciado (PID: ${BACKEND_PID})${NC}"

# Aguardar backend estar pronto
echo -e "${YELLOW}⏳ Aguardando backend ficar pronto...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend está respondendo!${NC}\n"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend não respondeu após 30s${NC}"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
done

# Iniciar Frontend
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${YELLOW}🚀 Iniciando Frontend (porta 5173)...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo -e "${GREEN}✅ Frontend iniciado (PID: ${FRONTEND_PID})${NC}\n"

# Aguardar frontend estar pronto
echo -e "${YELLOW}⏳ Aguardando frontend ficar pronto...${NC}"
sleep 3

# Resumo final
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ✅ APLICAÇÃO INICIADA!            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}\n"

echo -e "${BLUE}📊 Status:${NC}"
echo -e "   ${GREEN}✅ Backend:${NC}  http://localhost:3001 (PID: ${BACKEND_PID})"
echo -e "   ${GREEN}✅ Frontend:${NC} http://localhost:5173 (PID: ${FRONTEND_PID})"

echo -e "\n${BLUE}🌐 Acesse a aplicação:${NC}"
echo -e "   ${YELLOW}http://localhost:5173${NC}"

echo -e "\n${BLUE}🧪 Testar API diretamente:${NC}"
echo -e "   ${YELLOW}curl http://localhost:3001/health${NC}"

echo -e "\n${BLUE}🛑 Para parar os servidores:${NC}"
echo -e "   ${YELLOW}kill ${BACKEND_PID} ${FRONTEND_PID}${NC}"
echo -e "   ${YELLOW}ou pressione Ctrl+C e execute: ./stop-local.sh${NC}"

echo -e "\n${GREEN}Happy Coding! 🚀${NC}\n"

# Salvar PIDs para o script de stop
echo "${BACKEND_PID}" > .backend.pid
echo "${FRONTEND_PID}" > .frontend.pid

# Aguardar Ctrl+C
trap "echo -e '\n${YELLOW}🛑 Parando servidores...${NC}'; kill ${BACKEND_PID} ${FRONTEND_PID} 2>/dev/null; rm -f .backend.pid .frontend.pid; echo -e '${GREEN}✅ Servidores parados!${NC}'; exit 0" INT

wait