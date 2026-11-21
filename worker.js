#!/usr/bin/env node
// CLI used by the worker (Devin) to pull pending jobs and mark them done.
//   node worker.js list [--all]
//   node worker.js done <jobId> --url <notionPageUrl> [--file <outputFile>]
//   node worker.js fail <jobId> --reason "<text>"
const jobs = require('./lib/jobs');

const [cmd, id, ...rest] = process.argv.slice(2);
const flag = (name) => { const i = rest.indexOf(`--${name}`); return i >= 0 ? rest[i + 1] : undefined; };

if (cmd === 'list') {
  const all = jobs.list();
  const show = process.argv.includes('--all') ? all : all.filter((j) => j.status === 'pending');
  console.log(JSON.stringify(show, null, 2));
} else if (cmd === 'done') {
  const patch = { status: 'done', notionUrl: flag('url') };
  if (flag('file')) patch.outputFile = flag('file');
  console.log(JSON.stringify(jobs.update(id, patch), null, 2));
} else if (cmd === 'fail') {
  console.log(JSON.stringify(jobs.update(id, { status: 'failed', error: flag('reason') }), null, 2));
} else {
  console.error('Usage: node worker.js list [--all] | done <id> --url <url> [--file <path>] | fail <id> --reason <text>');
  process.exit(1);
}
