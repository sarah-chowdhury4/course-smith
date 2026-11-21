// Read-only access to a Student OS dashboard through the public notion.site API.
// Writes (creating notes / assignment pages) are done by the worker (Devin via the Notion connector).
const { config } = require('./store');

const REQUIRED_DATABASES = ['Courses', 'Notes', 'Assignments'];

// "https://name.notion.site/Student-OS-Dashboard-41f71a19...?source=copy_link" -> { site, pageId }
function parseDashboardUrl(raw) {
  let url;
  try { url = new URL(String(raw || '').trim()); } catch { throw new Error('Enter a valid Notion URL'); }
  const hex = (url.pathname.replace(/-/g, '').match(/[0-9a-f]{32}$/i) || [])[0];
  if (!hex) throw new Error('Could not find a page ID in that URL');
  if (!url.hostname.endsWith('.notion.site')) {
    throw new Error('Use the published link (https://<name>.notion.site/...). In Notion: Share → Publish.');
  }
  const pageId = hex.toLowerCase().replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
  return { site: url.origin, pageId, url: url.origin + url.pathname };
}

function dashboard() {
  const saved = config.get().notion;
  if (saved && saved.site && saved.pageId) return saved;
  if (process.env.NOTION_SITE && process.env.NOTION_DASHBOARD_ID) {
    return { site: process.env.NOTION_SITE, pageId: process.env.NOTION_DASHBOARD_ID };
  }
  throw Object.assign(new Error('Add your published Notion dashboard URL first.'), { status: 409 });
}

async function post(site, endpoint, body) {
  const res = await fetch(`${site}/api/v3/${endpoint}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Notion ${endpoint} failed: ${res.status}`);
  return res.json();
}

const unwrap = (rec) => (rec && rec.value && rec.value.value) || (rec && rec.value) || {};
const plain = (prop) => (prop || []).map((seg) => seg[0]).join('');
const pageUrl = (id) => `https://www.notion.so/${id.replace(/-/g, '')}`;
const loadPage = (site, pageId) => post(site, 'loadPageChunk', {
  pageId, limit: 100, cursor: { stack: [] }, chunkNumber: 0, verticalColumns: false,
});

async function loadDatabases(dash = dashboard()) {
  const chunk = await loadPage(dash.site, dash.pageId);
  const blocks = chunk.recordMap.block || {};
  if (!blocks[dash.pageId]) throw new Error('Dashboard page not found. Is it published to the web?');
  const collections = chunk.recordMap.collection || {};
  const dbs = {};
  for (const rec of Object.values(blocks)) {
    const b = unwrap(rec);
    if (!b.collection_id) continue;
    const c = unwrap(collections[b.collection_id]);
    const name = plain(c.name).trim();
    dbs[name] = { collectionId: b.collection_id, viewId: b.view_ids[0], schema: c.schema || {} };
  }
  const missing = REQUIRED_DATABASES.filter((n) => !dbs[n]);
  if (missing.length) throw new Error(`Dashboard is missing database(s): ${missing.join(', ')}`);
  return dbs;
}

async function queryRows(site, db) {
  const data = await post(site, 'queryCollection', {
    collection: { id: db.collectionId },
    collectionView: { id: db.viewId },
    loader: {
      type: 'reducer',
      reducers: { collection_group_results: { type: 'results', limit: 500 } },
      searchQuery: '', userTimeZone: 'UTC',
    },
  });
  const ids = data.result.reducerResults.collection_group_results.blockIds;
  const blocks = data.recordMap.block;
  return ids.map((id) => {
    const b = unwrap(blocks[id]);
    const props = {};
    for (const [key, def] of Object.entries(db.schema)) {
      const raw = (b.properties || {})[key];
      if (def.type === 'relation') {
        props[def.name] = (raw || []).filter((s) => s[1]).map((s) => s[1][0][1]);
      } else {
        props[def.name] = plain(raw);
      }
    }
    return { id, url: pageUrl(id), title: props.Name || plain((b.properties || {}).title), props };
  });
}

async function snapshot() {
  const dash = dashboard();
  const dbs = await loadDatabases(dash);
  const [courses, notes, assignments] = await Promise.all(REQUIRED_DATABASES.map((n) => queryRows(dash.site, dbs[n])));
  return {
    databases: Object.fromEntries(REQUIRED_DATABASES.map((n) => [n, `collection://${dbs[n].collectionId}`])),
    courses: courses.map((c) => ({
      id: c.id,
      name: c.title,
      url: c.url,
      notes: notes.filter((n) => (n.props.Courses || []).includes(c.id)).map((n) => n.title),
      assignments: assignments.filter((a) => (a.props.Courses || []).includes(c.id)).map((a) => a.title),
    })),
    notes: notes.map((n) => ({ id: n.id, title: n.title, courses: n.props.Courses || [] })),
    assignments: assignments.map((a) => ({ id: a.id, title: a.title, courses: a.props.Courses || [] })),
    fetchedAt: new Date().toISOString(),
  };
}

// Text of the list items under the "Primary Resources" heading on a course page.
async function primaryResources(pageId) {
  const chunk = await loadPage(dashboard().site, pageId);
  const blocks = chunk.recordMap.block;
  const page = unwrap(blocks[pageId]);
  const out = [];
  let inSection = false;
  for (const id of page.content || []) {
    const b = unwrap(blocks[id]);
    const text = plain((b.properties || {}).title).trim();
    if (/header$/.test(b.type || '')) { inSection = /primary resource/i.test(text); continue; }
    if (inSection && text) out.push(text);
  }
  return out;
}

module.exports = { snapshot, primaryResources, pageUrl, parseDashboardUrl, loadDatabases, dashboard };
