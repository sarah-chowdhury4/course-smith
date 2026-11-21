const { jobs } = require('./store');

function merge(found) {
  const all = jobs.get();
  const byId = new Map(all.map((j) => [j.id, j]));
  let added = 0;
  for (const j of found) {
    if (byId.has(j.id)) continue;
    const job = { ...j, status: 'pending', createdAt: new Date().toISOString() };
    all.push(job);
    byId.set(j.id, job);
    added++;
  }
  jobs.set(all);
  return added;
}

function add(job) {
  const all = jobs.get();
  const full = { ...job, status: 'pending', createdAt: new Date().toISOString() };
  all.push(full);
  jobs.set(all);
  return full;
}

function update(id, patch) {
  const all = jobs.get();
  const job = all.find((j) => j.id === id || j.id.startsWith(id));
  if (!job) throw new Error(`No job ${id}`);
  Object.assign(job, patch, { updatedAt: new Date().toISOString() });
  jobs.set(all);
  return job;
}

module.exports = { merge, add, update, list: jobs.get };
