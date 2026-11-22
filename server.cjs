const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const root = __dirname;
const port = Number(process.env.PORT || 4173);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

http.createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end('Bad request');
    return;
  }

  const filename = pathname === '/' ? 'index.html' : pathname.slice(1);
  const contentType = types[path.extname(filename)];
  try {
    if (!/^[a-z0-9_-]+\.[a-z0-9]+$/i.test(filename) || !contentType) throw new Error('Not a public asset');
    const file = path.join(root, filename);
    if (!(await fs.lstat(file)).isFile()) throw new Error('Not a regular file');
    const data = await fs.readFile(file);
    response.writeHead(200, { 'Content-Type': contentType });
    response.end(request.method === 'HEAD' ? undefined : data);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(request.method === 'HEAD' ? undefined : await fs.readFile(path.join(root, '404.html')));
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Zaman demo: http://127.0.0.1:${port}`);
});
