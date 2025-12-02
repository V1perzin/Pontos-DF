const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const SECRET = 'dev_secret_change_me';
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(bodyParser.json());

// Initialize SQLite DB
const DB_FILE = path.join(__dirname, 'data.sqlite');
const db = new sqlite3.Database(DB_FILE);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'user',
    verified INTEGER DEFAULT 0,
    verify_token TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    latitude REAL,
    longitude REAL,
    geojson TEXT,
    status TEXT DEFAULT 'pending',
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Create default admin if not exists
const defaultAdminEmail = 'admin@exemplo.com';
const defaultAdminPassword = '123456';
db.get("SELECT * FROM users WHERE email = ?", [defaultAdminEmail], (err, row) => {
  if (err) return console.error(err);
  if (!row) {
    bcrypt.hash(defaultAdminPassword, 10).then(hash => {
      db.run("INSERT INTO users (name,email,password,role,verified) VALUES (?,?,?,?,1)",
        ['Admin', defaultAdminEmail, hash, 'admin']);
      console.log('Default admin created:', defaultAdminEmail, defaultAdminPassword);
    });
  } else {
    console.log('Admin exists:', defaultAdminEmail);
  }
});

// Helpers
function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: '7d' });
}
function authMiddleware(req,res,next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token' });
  const token = header.split(' ')[1];
  try {
    const data = jwt.verify(token, SECRET);
    req.user = data;
    next();
  } catch(e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
function adminMiddleware(req,res,next) {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ error: 'Admin only' });
}

// Auth routes
app.post('/api/register', async (req,res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  const hash = await bcrypt.hash(password, 10);
  const verify_token = Math.random().toString(36).slice(2,10);
  db.run("INSERT INTO users (name,email,password,verify_token) VALUES (?,?,?,?)", [name,email,hash,verify_token], function(err) {
    if (err) {
      return res.status(400).json({ error: 'Email already used' });
    }
    console.log('Activation token (show this to tester):', verify_token);
    return res.json({ message: 'User created. Activation token printed on server console.' });
  });
});

app.post('/api/activate', (req,res) => {
  const { email, token } = req.body;
  db.get("SELECT * FROM users WHERE email = ?", [email], (err,row) => {
    if (err || !row) return res.status(400).json({ error: 'User not found' });
    if (row.verify_token === token) {
      db.run("UPDATE users SET verified = 1 WHERE id = ?", [row.id]);
      return res.json({ message: 'Account activated' });
    }
    return res.status(400).json({ error: 'Invalid token' });
  });
});

app.post('/api/login', (req,res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email = ?", [email], async (err,row) => {
    if (err || !row) return res.status(400).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, row.password);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
    if (!row.verified) return res.status(403).json({ error: 'Account not activated' });
    const token = generateToken(row);
    return res.json({ token });
  });
});

// Point submission: form or GeoJSON upload
app.post('/api/points', upload.single('file'), (req,res) => {
  const userId = req.body.userId || null;
  if (req.file) {
    // read geojson file and insert features as pending points
    const content = fs.readFileSync(req.file.path, 'utf8');
    try {
      const gj = JSON.parse(content);
      if (gj.type === 'FeatureCollection' && Array.isArray(gj.features)) {
        const stmt = db.prepare("INSERT INTO points (name,description,latitude,longitude,geojson,created_by) VALUES (?,?,?,?,?,?)");
        gj.features.forEach(f => {
          const coords = f.geometry && f.geometry.coordinates;
          const lat = coords ? coords[1] : null;
          const lon = coords ? coords[0] : null;
          const props = f.properties || {};
          stmt.run(props.name||props.title||'GeoJSON Point', props.description||'', lat, lon, JSON.stringify(f), userId);
        });
        stmt.finalize();
        return res.json({ message: 'GeoJSON uploaded, features saved as pending' });
      } else {
        return res.status(400).json({ error: 'Invalid GeoJSON' });
      }
    } catch(e) {
      return res.status(400).json({ error: 'Invalid file' });
    }
  } else {
    // single point from form
    const { name, description, latitude, longitude, created_by } = req.body;
    if (!latitude || !longitude) return res.status(400).json({ error: 'Missing coordinates' });
    db.run("INSERT INTO points (name,description,latitude,longitude,geojson,created_by) VALUES (?,?,?,?,?,?)",
      [name||'Point', description||'', latitude, longitude, null, created_by||null], function(err) {
        if (err) return res.status(500).json({ error: 'DB error' });
        return res.json({ message: 'Point submitted and pending approval' });
      });
  }
});

// Public: get approved points
app.get('/api/points', (req,res) => {
  db.all("SELECT * FROM points WHERE status = 'approved'", [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    return res.json(rows);
  });
});

// Admin: list pending points (paginated)
app.get('/api/admin/points', authMiddleware, adminMiddleware, (req,res) => {
  const page = parseInt(req.query.page||'1');
  const limit = 10;
  const offset = (page-1)*limit;
  db.all("SELECT * FROM points WHERE status = 'pending' ORDER BY created_at DESC LIMIT ? OFFSET ?", [limit, offset], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    return res.json(rows);
  });
});

app.post('/api/admin/points/:id/approve', authMiddleware, adminMiddleware, (req,res) => {
  const id = req.params.id;
  db.run("UPDATE points SET status = 'approved' WHERE id = ?", [id], function(err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    return res.json({ message: 'Approved' });
  });
});
app.post('/api/admin/points/:id/reject', authMiddleware, adminMiddleware, (req,res) => {
  const id = req.params.id;
  db.run("UPDATE points SET status = 'rejected' WHERE id = ?", [id], function(err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    return res.json({ message: 'Rejected' });
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log('Server running on', PORT);
});