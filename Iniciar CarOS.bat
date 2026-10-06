@echo off
title CarOS
echo Iniciando o CarOS... (feche esta janela para desligar o sistema)
cd /d "%~dp0"
start "" "http://localhost:3000"
npm run dev
