const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let courses = [];

async function api(path, body) {
  const res = await fetch(path, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {});
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.style.display = 'block';
  clearTimeout(toast.timer); toast.timer = setTimeout(() => { t.style.display = 'none'; }, 3000);
}

async function loadCourses() {
  $('#courses').textContent = 'Loading courses from Notion…';
  try {
    courses = await api('/api/courses');
  } catch (e) { $('#courses').innerHTML = `<p class="warn">${esc(e.message)}</p>`; return; }
  $('#courses').innerHTML = courses.map((c) => `
    <div class="course">
      <div><a href="${c.url}" target="_blank">${esc(c.name)}</a>
        <div class="hint">${c.notes.length} notes · ${c.assignments.length} assignments</div></div>
      <input data-id="${c.id}" data-name="${esc(c.name)}" value="${esc(c.folder)}" placeholder="/path/to/${esc(c.name)}">
    </div>`).join('');
  $('#topicCourse').innerHTML = courses.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
}

function renderJobs(list) {
  const rows = [...list].reverse().map((j) => `<tr>
    <td>${j.type}</td><td>${esc(j.courseName)}</td><td>${esc(j.title)}${j.details ? `<div class="hint">${esc(j.details)}</div>` : ''}</td>
    <td><span class="badge ${j.status}">${j.status}</span></td>
    <td>${j.notionUrl ? `<a href="${j.notionUrl}" target="_blank">Notion page</a>` : ''}
        ${j.status === 'done' && j.outputFile ? `<div class="hint">${esc(j.outputFile)}</div>` : ''}
        ${j.error ? `<span class="warn">${esc(j.error)}</span>` : ''}</td></tr>`);
  $('#jobs').innerHTML = rows.join('') || '<tr><td colspan="5" class="hint">No jobs yet.</td></tr>';
}

function renderReport(report) {
  if (!report.length) { $('#report').innerHTML = '<p class="hint">No course folders configured yet.</p>'; return; }
  const item = (x) => `<li class="${x.synced ? 'ok' : 'todo'}">${esc(x.file)} — ${x.synced ? 'in Notion' : 'queued'}</li>`;
  $('#report').innerHTML = `<div class="report">${report.map((r) => `
    <h3>${esc(r.courseName)}</h3>
    ${r.missing.length ? `<p class="warn">Missing: ${r.missing.join(', ')}</p>` : ''}
    <strong>Resources</strong><ul>${r.resources.map(item).join('') || '<li class="hint">empty</li>'}</ul>
    <strong>Assignments</strong><ul>${r.assignments.map(item).join('') || '<li class="hint">empty</li>'}</ul>`).join('')}</div>`;
}

$('#setup').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = { courses: {} };
  document.querySelectorAll('#courses input').forEach((i) => { body.courses[i.dataset.id] = { name: i.dataset.name, folder: i.value }; });
  await api('/api/config', body);
  toast('Folders saved');
});

$('#scan').addEventListener('click', async () => {
  $('#scan').disabled = true;
  try {
    const r = await api('/api/scan', {});
    renderReport(r.report); renderJobs(r.jobs);
    toast(`${r.added} new job(s) queued`);
  } catch (e) { toast(e.message); }
  $('#scan').disabled = false;
});

$('#topic').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  try {
    await api('/api/topic', Object.fromEntries(f));
    e.target.topic.value = ''; e.target.details.value = '';
    toast('Topic notes requested'); renderJobs(await api('/api/jobs'));
  } catch (err) { toast(err.message); }
});

$('#settings').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const r = await api('/api/settings', { dashboardUrl: $('#dashboardUrl').value });
    $('#dashboardUrl').value = r.dashboardUrl;
    toast('Dashboard connected');
    loadCourses();
  } catch (err) { toast(err.message); }
});

$('#reload').addEventListener('click', loadCourses);
api('/api/settings').then((s) => { $('#dashboardUrl').value = s.dashboardUrl; });
loadCourses();
api('/api/jobs').then(renderJobs);
setInterval(() => api('/api/jobs').then(renderJobs).catch(() => {}), 5000);
