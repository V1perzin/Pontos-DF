/**
 * Simple backend prototype for Pontos DF
 * - SQLite file-based DB (db.sqlite)
 * - Users table, Points table
 * - Auth with JWT (email + password)
 * - Image uploads stored in /uploads
 *
 * NOTE: THIS IS A PROTOTYPE. Do NOT use in production without security review.
 */

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_secret_for_prod';

// Create uploads folder
const UPLOADS = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS);

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage });

// DB setup (file-based)
const DB_FILE = path.join(__dirname, "db.sqlite");
const db = new sqlite3.Database(DB_FILE);

function initDb(){
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password_hash TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT,
      label TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      category_id INTEGER,
      address TEXT,
      description TEXT,
      latitude REAL,
      longitude REAL,
      image_url TEXT,
      status TEXT DEFAULT 'pendente',
      submitted_by INTEGER,
      admin_comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(category_id) REFERENCES categories(id),
      FOREIGN KEY(submitted_by) REFERENCES users(id)
    )`);
    // insert basic categories if not exists
    db.get("SELECT COUNT(*) as c FROM categories", (err, row) => {
      if(row && row.c === 0){
        const stmt = db.prepare("INSERT INTO categories(key,label) VALUES (?,?)");
        const cats = [
          ['saude','Serviços de Saúde'],
          ['escola','Escolas'],
          ['turismo','Turismo'],
          ['transporte','Transporte'],
          ['seguranca','Segurança'],
          ['comercio','Comércio']
        ];
        cats.forEach(c => stmt.run(c[0], c[1]));
        stmt.finalize();
        console.log('Inserted categories');
      }
    });
    // create a default admin if none exists
    db.get("SELECT COUNT(*) as c FROM users", (err, row) => {
      if(row && row.c === 0){
        const pw = 'admin123';
        bcrypt.hash(pw, 10, (err, hash) => {
          db.run("INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)",
            ['Admin','admin@example.com',hash,'admin']);
          console.log('Inserted default admin: admin@example.com / admin123');
        });
      }
    });
  });
}

initDb();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS));

// Helpers
function generateToken(user){
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
}

function authMiddleware(req, res, next){
  const auth = req.headers.authorization;
  if(!auth) return res.status(401).json({ error: 'No token' });
  const parts = auth.split(' ');
  if(parts.length !== 2) return res.status(401).json({ error: 'Token error' });
  const token = parts[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if(err) return res.status(401).json({ error: 'Token invalid' });
    req.user = decoded;
    next();
  });
}

function adminMiddleware(req, res, next){
  if(!req.user) return res.status(401).json({ error: 'No user' });
  if(req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

// Routes

// Auth: register
app.post('/auth/register', (req,res) => {
  const { name, email, password } = req.body;
  if(!email || !password) return res.status(400).json({ error: 'Missing email or password' });
  bcrypt.hash(password, 10, (err, hash) => {
    db.run("INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)", [name||'', email, hash, 'user'], function(err){
      if(err) return res.status(400).json({ error: 'Email may be already used' });
      const user = { id: this.lastID, email, role: 'user' };
      const token = generateToken(user);
      res.json({ user: { id: user.id, email: user.email, role: user.role }, token });
    });
  });
});

// Auth: login
app.post('/auth/login', (req,res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
    if(err || !row) return res.status(400).json({ error: 'Invalid credentials' });
    bcrypt.compare(password, row.password_hash, (err, ok) => {
      if(!ok) return res.status(400).json({ error: 'Invalid credentials' });
      const token = generateToken(row);
      res.json({ user: { id: row.id, email: row.email, role: row.role, name: row.name }, token });
    });
  });
});

// Get categories
app.get('/api/categories', (req,res) => {
  db.all("SELECT * FROM categories ORDER BY id", (err, rows) => {
    res.json(rows);
  });
});

// Public: list validated points with optional filters
app.get('/api/points', (req,res) => {
  const { q, category } = req.query;
  let sql = "SELECT p.*, c.label as category_label FROM points p LEFT JOIN categories c ON p.category_id = c.id WHERE p.status = 'validado'";
  const params = [];
  if(category){
    sql += " AND c.key = ?";
    params.push(category);
  }
  if(q){
    sql += " AND (p.name LIKE ? OR p.description LIKE ?)";
    params.push('%'+q+'%', '%'+q+'%');
  }
  db.all(sql, params, (err, rows) => {
    res.json(rows || []);
  });
});

// Public: get point detail
app.get('/api/points/:id', (req,res) => {
  db.get("SELECT p.*, c.label as category_label FROM points p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?", [req.params.id], (err,row) => {
    if(!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });
});

// Authenticated: create point (user)
app.post('/api/points', authMiddleware, upload.single('image'), (req,res) => {
  const { name, category_id, address, description, latitude, longitude } = req.body;
  const image_url = req.file ? '/uploads/' + req.file.filename : null;
  // if latitude/longitude provided by geocoding from frontend it's used; otherwise null
  db.run(`INSERT INTO points(name,category_id,address,description,latitude,longitude,image_url,status,submitted_by)
    VALUES(?,?,?,?,?,?,?,?,?)`,
    [name, category_id, address, description, latitude || null, longitude || null, image_url, 'pendente', req.user.id],
    function(err){
      if(err) return res.status(500).json({ error: 'DB error' });
      db.get("SELECT * FROM points WHERE id = ?", [this.lastID], (e, row) => {
        res.status(201).json(row);
      });
    });
});

// Authenticated: user edits own point (only if pendente)
app.put('/api/points/:id', authMiddleware, upload.single('image'), (req,res) => {
  const id = req.params.id;
  db.get("SELECT * FROM points WHERE id = ?", [id], (err,row) => {
    if(!row) return res.status(404).json({ error: 'Not found' });
    if(req.user.role !== 'admin' && row.submitted_by !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    // allow edit
    const { name, category_id, address, description, latitude, longitude } = req.body;
    const image_url = req.file ? '/uploads/' + req.file.filename : row.image_url;
    db.run(`UPDATE points SET name=?,category_id=?,address=?,description=?,latitude=?,longitude=?,image_url=?,status='pendente' WHERE id=?`,
      [name, category_id, address, description, latitude || null, longitude || null, image_url, id], function(err){
        if(err) return res.status(500).json({ error: 'DB error' });
        db.get("SELECT * FROM points WHERE id = ?", [id], (e, r) => res.json(r));
    });
  });
});

// Admin: list pending
app.get('/api/admin/points', authMiddleware, adminMiddleware, (req,res) => {
  const status = req.query.status || 'pendente';
  db.all("SELECT p.*, u.email as submitter_email, c.label as category_label FROM points p LEFT JOIN users u ON p.submitted_by = u.id LEFT JOIN categories c ON p.category_id = c.id WHERE p.status = ?", [status], (err, rows) => {
    res.json(rows || []);
  });
});

// Admin: validate or reject
app.post('/api/admin/points/:id/validate', authMiddleware, adminMiddleware, (req,res) => {
  const id = req.params.id;
  const { action, comment } = req.body; // action: validado | rejeitado
  if(!['validado','rejeitado'].includes(action)) return res.status(400).json({ error: 'Invalid action' });
  db.run("UPDATE points SET status=?, admin_comment=? WHERE id = ?", [action, comment || null, id], function(err){
    if(err) return res.status(500).json({ error: 'DB error' });
    db.get("SELECT * FROM points WHERE id = ?", [id], (e,r) => res.json(r));
  });
});

app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});