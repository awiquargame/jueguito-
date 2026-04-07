const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DB_FILE = path.join(__dirname, 'database.json');

// Ensure database file exists
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: {} }, null, 2));
}

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        const url = req.url;

        if (url === '/api/register' && req.method === 'POST') {
            try {
                const { username, password } = JSON.parse(body);
                const db = JSON.parse(fs.readFileSync(DB_FILE));

                if (db.users[username]) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'El usuario ya existe' }));
                    return;
                }

                db.users[username] = {
                    password, // In a real app, hash this!
                    data: {}
                };

                fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Usuario registrado con éxito' }));
            } catch (e) {
                res.writeHead(500);
                res.end();
            }
        }
        else if (url === '/api/login' && req.method === 'POST') {
            try {
                const { username, password } = JSON.parse(body);
                const db = JSON.parse(fs.readFileSync(DB_FILE));

                const user = db.users[username];
                if (user && user.password === password) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ username, data: user.data }));
                } else {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Usuario o contraseña incorrectos' }));
                }
            } catch (e) {
                res.writeHead(500);
                res.end();
            }
        }
        else if (url === '/api/save' && req.method === 'POST') {
            try {
                const { username, data } = JSON.parse(body);
                const db = JSON.parse(fs.readFileSync(DB_FILE));

                if (!db.users[username]) {
                    res.writeHead(404);
                    res.end();
                    return;
                }

                // Update data, ensure competitiveHighScore is preserved or updated
                db.users[username].data = { ...db.users[username].data, ...data };
                
                fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Progreso guardado' }));
            } catch (e) {
                res.writeHead(500);
                res.end();
            }
        }
        else if (url === '/api/leaderboard' && req.method === 'GET') {
            try {
                const db = JSON.parse(fs.readFileSync(DB_FILE));
                const leaderboard = Object.keys(db.users)
                    .map(username => ({
                        username,
                        score: db.users[username].data.competitiveHighScore || 0
                    }))
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 10);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(leaderboard));
            } catch (e) {
                res.writeHead(500);
                res.end();
            }
        }
        else {
            res.writeHead(404);
            res.end();
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor de cuentas iniciado en http://localhost:${PORT}`);
    console.log(`Para conectar otros PCs, usa tu IP local en lugar de localhost.`);
});
