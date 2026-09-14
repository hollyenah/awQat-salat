// server.js
// Serveur local pour l'application "Horaires de Prière"
// 100% hors-ligne : aucune dépendance externe, uniquement les modules natifs de Node.js
//
// Lancement :   node server.js
// Écran TV :        http://<adresse-locale>:3000/
// Administration :   http://<adresse-locale>:3000/admin.html
// Trouver l'adresse : http://<adresse-locale>:3000/info

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_FILE = path.join(__dirname, 'data.json');

const DEFAULT_DATA = {
  mosqueName: 'MASJID',
    hijriOffset: 0,
    showGregorian: true,
    showHijri: true,

  prayers: {
    fajr: '05:30',
    zuhr: '13:15',
    asr: '16:45',
    maghrib: '19:20',
    isha: '20:45',
    jumuah: '13:30'
  },
  footerMessage: 'MADE by HJ. QASSIM',
  showFooter: true
};

// ---- Persistance des données -------------------------------------------

function loadData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_DATA,
      ...parsed,
      prayers: { ...DEFAULT_DATA.prayers, ...(parsed.prayers || {}) }
    };
  } catch (e) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
    return { ...DEFAULT_DATA };
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

let state = loadData();

// ---- Diffusion en temps réel vers l'écran TV (Server-Sent Events) ------

let sseClients = [];

function broadcast(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((res) => {
    try { res.write(payload); } catch (e) { /* client déconnecté */ }
  });
}

// ---- Fichiers statiques ---------------------------------------------

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function serveStatic(reqPath, res) {
  const safePath = path.normalize(reqPath === '/' ? '/tv.html' : reqPath);
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Interdit');
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Fichier introuvable');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  });
}

function readBody(req, cb) {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > 1e6) req.destroy(); // garde-fou anti-surcharge
  });
  req.on('end', () => cb(body));
}

function localAddresses() {
  const nets = os.networkInterfaces();
  const list = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) list.push(net.address);
    }
  }
  return list;
}

// ---- Serveur HTTP -------------------------------------------------------

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  // Lecture des données actuelles
  if (url === '/api/data' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(state));
    return;
  }

  // Mise à jour des données depuis le téléphone
  if (url === '/api/data' && req.method === 'POST') {
    readBody(req, (body) => {
      try {
        const updates = JSON.parse(body);
        state = {
          ...state,
          ...updates,
          prayers: { ...state.prayers, ...(updates.prayers || {}) }
        };
        saveData(state);
        broadcast(state);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(state));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'JSON invalide' }));
      }
    });
    return;
  }

  // Flux temps réel écouté par l'écran TV
  if (url === '/api/events' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.write(`data: ${JSON.stringify(state)}\n\n`);
    sseClients.push(res);
    req.on('close', () => {
      sseClients = sseClients.filter((c) => c !== res);
    });
    return;
  }

  // Page pratique indiquant l'adresse à saisir sur le téléphone
  if (url === '/info' && req.method === 'GET') {
    const addresses = localAddresses();
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Adresse du serveur</title>
<style>body{font-family:sans-serif;background:#0A1F1C;color:#F5F1E6;padding:40px;font-size:20px;line-height:1.6}
a{color:#C9A227} li{margin-bottom:8px}</style></head><body>
<h1>Accès à l'administration</h1>
<p>Depuis le téléphone, connecté au même Wi-Fi, ouvrir l'une de ces adresses :</p>
<ul>${addresses.length
        ? addresses.map((a) => `<li><a href="http://${a}:${PORT}/admin.html">http://${a}:${PORT}/admin.html</a></li>`).join('')
        : '<li>Aucune adresse réseau détectée — vérifiez la connexion Wi-Fi.</li>'}</ul>
<p>Adresse de l'écran TV : <b>http://${addresses[0] || 'localhost'}:${PORT}/</b></p>
</body></html>`);
    return;
  }

  serveStatic(url, res);
});

server.listen(PORT, () => {
  const addresses = localAddresses();
  console.log('=================================================');
  console.log(' Serveur "Horaires de Prière" démarré');
  console.log(` Écran TV local :       http://localhost:${PORT}/`);
  console.log(` Administration locale : http://localhost:${PORT}/admin.html`);
  console.log(' Adresses réseau local (à utiliser depuis le téléphone) :');
  if (addresses.length) {
    addresses.forEach((a) => console.log(`   → http://${a}:${PORT}/admin.html`));
  } else {
    console.log('   Aucune interface réseau détectée.');
  }
  console.log(' (voir aussi /info depuis n\'importe quel navigateur du réseau)');
  console.log('=================================================');
});
