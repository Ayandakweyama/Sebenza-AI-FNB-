const http = require('http');
const net = require('net');
const next = require('next');
const { PrismaClient } = require('@prisma/client');
const { WebSocketServer } = require('ws');
const crypto = require('crypto');

const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = Number.parseInt(process.env.PORT || '3000', 10);

const prisma = new PrismaClient();
const app = next({ dev: false, hostname, port, dir: __dirname });
const handle = app.getRequestHandler();

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  const parts = String(header).split(';');
  for (const p of parts) {
    const i = p.indexOf('=');
    if (i === -1) continue;
    const k = p.slice(0, i).trim();
    const v = p.slice(i + 1).trim();
    out[k] = decodeURIComponent(v);
  }
  return out;
}

function sha256(s) {
  return crypto.createHash('sha256').update(String(s)).digest('hex');
}

function cookieNameForSession(sessionId) {
  return 'sebenza_auto_apply_access_' + String(sessionId);
}

function htmlEscape(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildLoginHtml(token) {
  const safeToken = htmlEscape(token);
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Sebenza AI • Indeed Login</title>
    <style>
      html, body { height: 100%; margin: 0; background: #050815; color: #fff; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; }
      #wrap { height: 100%; display: flex; flex-direction: column; }
      #top { padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.04); display:flex; justify-content:space-between; gap: 12px; flex-wrap: wrap; }
      #screen { flex: 1; min-height: 0; }
      .muted { color: rgba(255,255,255,.7); font-size: 12px; }
      .pill { border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.06); padding: 6px 10px; border-radius: 999px; font-size: 12px; }
    </style>
  </head>
  <body>
    <div id="wrap">
      <div id="top">
        <div>
          <div style="font-weight:700">Indeed Login Window</div>
          <div class="muted">Sign in, then close this tab. The agent will continue automatically.</div>
        </div>
        <div class="pill">Session: ${safeToken}</div>
      </div>
      <div id="screen"></div>
    </div>
    <script type="module">
      import RFB from 'https://cdn.jsdelivr.net/npm/@novnc/novnc@1.5.0/core/rfb.js';
      const token = ${JSON.stringify(token)};
      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl = proto + '://' + location.host + '/__auto_apply_ws/' + encodeURIComponent(token);
      const screen = document.getElementById('screen');
      const rfb = new RFB(screen, wsUrl, {});
      rfb.scaleViewport = true;
      rfb.resizeSession = true;
      rfb.background = '#050815';
    </script>
  </body>
</html>`;
}

app
  .prepare()
  .then(() => {
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
        if (req.method === 'GET' && url.pathname.startsWith('/__auto_apply_login/')) {
          const token = decodeURIComponent(url.pathname.replace('/__auto_apply_login/', '').replaceAll('/', ''));
          const session = await prisma.autoApplySession.findFirst({ where: { loginToken: token } });
          const cookies = parseCookies(req.headers.cookie);
          const secret = session ? cookies[cookieNameForSession(session.id)] : null;
          const secretHash = secret ? sha256(secret) : null;

          if (
            !session ||
            !session.loginExpiresAt ||
            session.loginExpiresAt.getTime() < Date.now() ||
            !session.loginVncPort ||
            !session.loginSecretHash ||
            !secretHash ||
            secretHash !== session.loginSecretHash
          ) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Login session expired.');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
          res.end(buildLoginHtml(token));
          return;
        }

        await handle(req, res);
      } catch {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Server error');
      }
    });

    const wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', async (req, socket, head) => {
      try {
        const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
        if (!url.pathname.startsWith('/__auto_apply_ws/')) return socket.destroy();

        const token = decodeURIComponent(url.pathname.replace('/__auto_apply_ws/', '').replaceAll('/', ''));
        const session = await prisma.autoApplySession.findFirst({ where: { loginToken: token } });
        const cookies = parseCookies(req.headers.cookie);
        const secret = session ? cookies[cookieNameForSession(session.id)] : null;
        const secretHash = secret ? sha256(secret) : null;

        if (
          !session ||
          !session.loginExpiresAt ||
          session.loginExpiresAt.getTime() < Date.now() ||
          !session.loginVncPort ||
          !session.loginSecretHash ||
          !secretHash ||
          secretHash !== session.loginSecretHash
        ) {
          return socket.destroy();
        }

        wss.handleUpgrade(req, socket, head, (ws) => {
          const tcp = net.connect(session.loginVncPort, '127.0.0.1');

          const closeAll = () => {
            try { ws.close(); } catch {}
            try { tcp.destroy(); } catch {}
          };

          ws.on('message', (data) => {
            try { tcp.write(Buffer.from(data)); } catch { closeAll(); }
          });
          ws.on('close', closeAll);
          ws.on('error', closeAll);

          tcp.on('data', (chunk) => {
            try { ws.send(chunk); } catch { closeAll(); }
          });
          tcp.on('close', closeAll);
          tcp.on('error', closeAll);
        });
      } catch {
        socket.destroy();
      }
    });

    server.listen(port, hostname);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
