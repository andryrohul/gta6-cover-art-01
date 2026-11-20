// serve.ts — a tiny static server for local development.
//
// Serves app/ at http://localhost:8080 so the editor can be tried in a
// desktop browser exactly as the finalist review will serve it: plain
// static files, no build step, no network request. Screenshots are served
// under /screenshots/ for convenience.
//
//   node serve.ts            # http://localhost:8080
//   PORT=9000 node serve.ts  # http://localhost:9000

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(new URL('.', import.meta.url).pathname);
const appRoot = join(repoRoot, 'app');
const shotsRoot = join(repoRoot, 'screenshots');
const port = Number(process.env.PORT ?? 8080);

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

function safePath(root: string, urlPath: string): string | null {
  const decoded = decodeURIComponent(urlPath);
  const resolved = resolve(join(root, normalize(decoded).replace(/^(\.\.[/\\])+/, '')));
  if (resolved !== root && !resolved.startsWith(root + sep)) return null;
  return resolved;
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    let path = url.pathname;
    let root = appRoot;
    if (path.startsWith('/screenshots/')) {
      root = shotsRoot;
      path = path.slice('/screenshots/'.length);
    }
    if (path === '/' || path === '') path = 'index.html';
    const file = safePath(root, path);
    if (!file) {
      res.writeHead(403, { 'content-type': 'text/plain' });
      res.end('forbidden');
      return;
    }
    const body = await readFile(file);
    res.writeHead(200, {
      'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
      'content-length': body.length,
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
  }
});

server.listen(port, () => {
  console.log(`Vice City Sunset — Cover Maker: serving app/ at http://localhost:${port}`);
});
