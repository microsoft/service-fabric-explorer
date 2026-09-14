// Local-only server for testing the exact static artifact, including its CSP.
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '../../dist-preview');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep) || path.basename(file) === 'web.config' || !['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(403).end(); return;
    }
    const content = await fs.readFile(file);
    const config = await fs.readFile(path.join(root, 'web.config'), 'utf8');
    res.setHeader('Content-Security-Policy', config.match(/name="Content-Security-Policy" value="([^"]+)"/)[1]);
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    res.writeHead(200).end(req.method === 'HEAD' ? undefined : content);
  } catch { res.writeHead(404).end(); }
}).listen(3003, '127.0.0.1', () => console.log('Snapshot preview: http://127.0.0.1:3003'));
