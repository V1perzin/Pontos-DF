
# Pontos DF - Backend (prototype)

## Requisitos
- Node.js >= 18
- npm

## Instalar
```bash
cd backend
npm install
```

## Variáveis de ambiente (opcionais)
- `PORT` (padrão 4000)
- `JWT_SECRET` (padrão no código — troque para produção)

## Rodar
```bash
npm run dev
# ou
npm start
```

O servidor irá criar `db.sqlite` automaticamente e uma conta admin padrão:
- email: admin@example.com
- senha: admin123

Uploads ficam em `backend/uploads`.
