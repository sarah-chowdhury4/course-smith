const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.COURSESMITH_DATA || path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

function file(name) { return path.join(DATA_DIR, name); }

function read(name, fallback) {
  try { return JSON.parse(fs.readFileSync(file(name), 'utf8')); } catch { return fallback; }
}

function write(name, value) {
  fs.writeFileSync(file(name), JSON.stringify(value, null, 2));
}

const config = { get: () => read('config.json', { courses: {} }), set: (v) => write('config.json', v) };
const jobs = { get: () => read('jobs.json', []), set: (v) => write('jobs.json', v) };

module.exports = { config, jobs, DATA_DIR };
