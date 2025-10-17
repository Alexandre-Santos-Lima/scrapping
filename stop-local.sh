#!/bin/bash

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🛑 Parando Maps Scraper Pro...${NC}\n"

# Tentar usar os PIDs salvos
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    kill $BACKEND_PID 2>/dev/null
    echo -e "${GREEN}✅ Backend parado (PID: ${BACKEND_PID})${NC}"
    rm -f .backend.pid
fi

if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✅ Frontend parado (PID: ${FRONTEND_PID})${NC}"
    rm -f .frontend.pid
fi

# Garantir que as portas estão livres
echo -e "\n${YELLOW}🧹 Limpando portas...${NC}"

if lsof -ti:3001 >/dev/null 2>&1; then
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✅ Porta 3001 liberada${NC}"
fi

if lsof -ti:5173 >/dev/null 2>&1; then
    lsof -ti:5173 | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✅ Porta 5173 liberada${NC}"
fi

echo -e "\n${GREEN}✅ Todos os processos foram parados!${NC}\n"