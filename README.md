
Pontos DF Prototype - Modified
=============================

Structure:
- client/   -> React + Vite frontend (scaffold)
- server/   -> Express backend (SQLite)

Server:
1. cd server
2. npm install
3. npm start
- Default admin: admin@exemplo.com / 123456
- Activation tokens printed to server console for testing.

Client:
A minimal React + Vite scaffold was created in /client.
You can run a dev server after installing dependencies.

Notes:
- The frontend scaffold includes pages: Register, Login, Submit Point, Map (Cesium integration placeholder), Admin panel placeholder.
- The server implements JWT auth, user registration with activation token, point submission (form and GeoJSON upload), endpoints for admin approval.

This is a prototype scaffold. Further UI polish, Cesium integration, and detailed frontend code will be added on request.
