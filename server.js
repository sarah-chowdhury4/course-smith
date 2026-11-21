const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const notion = require('./lib/notion');
const { scan } = require('./lib/scan');
const jobs = require('./lib/jobs');
const { config } = require('./lib/store');

const PORT = Number(process.env.PORT || 4321);
const PUBLIC = path.join(__dirname, 'public');

const send = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
};

const readBody = (req) => new Promise((resolve, reject) => {
  let data = '';
  req.on('data', (c) => { data += c; });
  req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); } });
});

const routes = {
  'GET /api/courses': async () => {
    const snap = await notion.snapshot();
    const cfg = config.get();
    return snap.courses.map((c) => ({ ...c, folder: (cfg.courses[c.id] || {}).folder || '' }));
  },
  'POST /api/config': async (body) => {
    const cfg = config.get();
    for (const [id, c] of Object.entries(body.courses || {})) {
      cfg.courses[id] = { name: c.name, folder: (c.folder || '').trim() };
    }
    config.set(cfg);
    return cfg;
  },
  'POST /api/scan': async () => {
    const snap = await notion.snapshot();
    const { found, report } = scan(config.get(), snap);
    const added = jobs.merge(found);
    return { added, report, jobs: jobs.list() };
  },
  'GET /api/jobs': async () => jobs.list(),
  'POST /api/topic': async (body) => {
    if (!body.courseId || !body.topic) throw Object.assign(new Error('courseId and topic are required'), { status: 400 });
    const snap = await notion.snapshot();
    const course = snap.courses.find((c) => c.id === body.courseId);
    if (!course) throw Object.assign(new Error('Unknown course'), { status: 404 });
    return jobs.add({
      id: crypto.randomBytes(5).toString('hex'), type: 'topic', courseId: course.id, courseName: course.name,
      courseUrl: course.url, title: body.topic.trim(), details: (body.details || '').trim(),
    });
  },
};

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const handler = routes[`${req.method} ${url.pathname}`];
  if (handler) {
    try {
      send(res, 200, await handler(await readBody(req)));
    } catch (e) {
      send(res, e.status || 500, { error: e.message });
    }
    return;
  }
  const file = path.join(PUBLIC, url.pathname === '/' ? 'index.html' : path.normalize(url.pathname));
  if (!file.startsWith(PUBLIC) || !fs.existsSync(file)) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`CourseSmith running at http://localhost:${PORT}`));
