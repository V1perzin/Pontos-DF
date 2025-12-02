**Pontos DF - Protótipo (Frontend + Backend)**

Este repositório contém um protótipo funcional composto por:

Client (React + Vite) → Interface web

Server (Express + SQLite) → API com autenticação, envio de pontos e painel administrativo

O objetivo deste projeto é oferecer uma base inicial para um sistema de cadastro, visualização e aprovação de pontos geográficos, com autenticação de usuários, envio de dados e integração futura com mapas 3D.

Estrutura do Projeto

client/     # Frontend React + Vite
server/     # Backend Express + SQLite

client/

Frontend criado com React + Vite, contendo páginas base para:

Registro de usuário

Login

Envio de ponto (formulário e upload GeoJSON)

Tela de mapa (placeholder para integração com CesiumJS)

Painel administrativo (placeholder)

server/

Backend em Node.js + Express com:

Autenticação JWT

Registro de usuário com token de ativação

Login

Envio de pontos geográficos

Upload de GeoJSON

Endpoints de aprovação (admin)

Armazenamento em SQLite

Os tokens de ativação são exibidos automaticamente no console do servidor ao registrar um novo usuário.

Como Rodar o Projeto:

**1. Rodar o Backend**
cd server
npm install
npm start


O servidor iniciará em:

http://localhost:3000

Credenciais padrão (admin):

Email: admin@exemplo.com

Senha: 123456

**2. Rodar o Frontend**
cd client
npm install
npm run dev


O frontend iniciará em:

http://localhost:5173

Funcionalidades do Protótipo
Autenticação com JWT

Login

Registro

Token de ativação (exibido no console do servidor)

Controle de acesso básico

**Envio de Pontos**

Formulário para dados manuais

Upload de arquivo GeoJSON

Armazenamento no SQLite

**Mapa (placeholder)**

Área preparada para integração com:

CesiumJS

Mapbox

Leaflet

**Admin (placeholder)**

Painel administrativo básico para:

Listar pontos enviados

Aprovar / rejeitar pontos

Em breve (caso solicitado):

Filtros

Dashboard

Área de revisão

Moderação completa

**Fluxo Básico de Uso**

Rodar o server

Criar um usuário no frontend

Conferir o token de ativação no terminal do servidor

Ativar o usuário via endpoint

Login no frontend

Enviar um ponto ou arquivo GeoJSON

Admin acessa painel e aprova/rejeita

Resumo Técnico (para apresentação)

Protótipo completo para cadastro, visualização e aprovação de pontos geoespaciais, utilizando React + Vite no frontend e Express + SQLite no backend.
Inclui autenticação JWT, registro com token de ativação, envio de pontos (manual ou GeoJSON) e base para integração com mapas 3D. Ideal como ponto de partida para sistemas cartográficos, cadastro territorial, operações de campo e validação administrativa.
