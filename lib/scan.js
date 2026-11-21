const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Drafts CourseSmith writes into an Assignments folder; never treated as new assignment briefs.
const DRAFT_SUFFIX = ' - Submission';
const IGNORED = /^(\.|~\$)|\.(tmp|part)$/i;

const stem = (f) => path.basename(f, path.extname(f));
const norm = (s) => s.trim().toLowerCase();
const isDraft = (f) => stem(f).endsWith(DRAFT_SUFFIX);

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && !IGNORED.test(d.name))
    .map((d) => path.join(dir, d.name))
    .sort();
}

function findSub(folder, name) {
  if (!fs.existsSync(folder)) return path.join(folder, name);
  const hit = fs.readdirSync(folder).find((f) => norm(f) === norm(name));
  return path.join(folder, hit || name);
}

const jobId = (type, courseId, key) =>
  crypto.createHash('sha1').update(`${type}|${courseId}|${key}`).digest('hex').slice(0, 10);

// Compare course folders with the Notion snapshot and return the work that is missing.
function scan(config, snapshot) {
  const found = [];
  const report = [];
  for (const course of snapshot.courses) {
    const folder = config.courses[course.id] && config.courses[course.id].folder;
    if (!folder) continue;
    const resourcesDir = findSub(folder, 'Resources');
    const assignmentsDir = findSub(folder, 'Assignments');
    const notes = new Set(course.notes.map(norm));
    const assignments = new Set(course.assignments.map(norm));
    const entry = { courseId: course.id, courseName: course.name, folder, missing: [] };

    if (!fs.existsSync(folder)) entry.missing.push('course folder');
    if (!fs.existsSync(resourcesDir)) entry.missing.push('Resources');
    if (!fs.existsSync(assignmentsDir)) entry.missing.push('Assignments');

    const resources = listFiles(resourcesDir);
    const briefs = listFiles(assignmentsDir).filter((f) => !isDraft(f));
    entry.resources = resources.map((f) => ({ file: path.basename(f), synced: notes.has(norm(stem(f))) }));
    entry.assignments = briefs.map((f) => ({ file: path.basename(f), synced: assignments.has(norm(stem(f))) }));

    for (const f of resources) {
      if (notes.has(norm(stem(f)))) continue;
      found.push({
        id: jobId('note', course.id, f), type: 'note', courseId: course.id, courseName: course.name,
        courseUrl: course.url, title: stem(f), sourceFile: f,
      });
    }
    for (const f of briefs) {
      if (assignments.has(norm(stem(f)))) continue;
      found.push({
        id: jobId('assignment', course.id, f), type: 'assignment', courseId: course.id, courseName: course.name,
        courseUrl: course.url, title: stem(f), sourceFile: f,
        outputFile: path.join(assignmentsDir, `${stem(f)}${DRAFT_SUFFIX}.docx`),
      });
    }
    report.push(entry);
  }
  return { found, report };
}

module.exports = { scan, jobId };
