// Read-only access to the Student OS dashboard through the public notion.site API.
// Writes (creating notes / assignment pages) are done by the worker (Devin via the Notion connector).
const SITE = process.env.NOTION_SITE || 'https://cake-libra-920.notion.site';
const DASHBOARD_ID = process.env.NOTION_DASHBOARD_ID || '41f71a19-9ec6-8015-a64f-ebff21aa81fc';

async function post(endpoint, body) {
  const res = await fetch(`${SITE}/api/v3/${endpoint}`, {
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

async function loadDatabases() {
  const chunk = await post('loadPageChunk', {
    pageId: DASHBOARD_ID, limit: 100, cursor: { stack: [] }, chunkNumber: 0, verticalColumns: false,
  });
  const blocks = chunk.recordMap.block;
  const collections = chunk.recordMap.collection || {};
  const dbs = {};
  for (const rec of Object.values(blocks)) {
    const b = unwrap(rec);
    if (!b.collection_id) continue;
    const c = unwrap(collections[b.collection_id]);
    const name = plain(c.name).trim();
    dbs[name] = { collectionId: b.collection_id, viewId: b.view_ids[0], schema: c.schema || {} };
  }
  return dbs;
}

async function queryRows(db) {
  const data = await post('queryCollection', {
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
  const dbs = await loadDatabases();
  const [courses, notes, assignments] = await Promise.all(
    ['Courses', 'Notes', 'Assignments'].map((n) => (dbs[n] ? queryRows(dbs[n]) : [])),
  );
  return {
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

module.exports = { snapshot, pageUrl };
