// Opens a terminal window running the Devin CLI in this project, so Devin works through the job queue (see AGENTS.md).
const { spawn, spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PROMPT = 'Process the CourseSmith job queue. Follow AGENTS.md.';
const MODE = process.env.COURSESMITH_DEVIN_MODE || 'smart';
const LINUX_TERMINALS = ['x-terminal-emulator', 'gnome-terminal', 'konsole', 'xfce4-terminal', 'xterm'];

const has = (bin) => spawnSync(process.platform === 'win32' ? 'where' : 'which', [bin], { stdio: 'ignore' }).status === 0;
const shq = (s) => `'${s.replace(/'/g, `'\\''`)}'`;

function launch() {
  if (!has('devin')) {
    throw Object.assign(new Error('Devin CLI not found. Install it (README → Devin setup), then restart CourseSmith.'), { status: 409 });
  }
  const cmd = `devin --permission-mode ${MODE} -- "${PROMPT}"`;
  const opts = { cwd: ROOT, detached: true, stdio: 'ignore' };
  let child;
  if (process.platform === 'win32') {
    child = spawn('cmd', ['/c', `start "CourseSmith - Devin" cmd /k ${cmd}`], { ...opts, windowsVerbatimArguments: true });
  } else if (process.platform === 'darwin') {
    const script = `cd ${shq(ROOT)} && ${cmd}`;
    child = spawn('osascript', ['-e', `tell application "Terminal" to do script ${JSON.stringify(script)}`,
      '-e', 'tell application "Terminal" to activate'], opts);
  } else {
    const term = LINUX_TERMINALS.find(has);
    if (!term) throw Object.assign(new Error(`No terminal found. Run this in the CourseSmith folder: ${cmd}`), { status: 409 });
    const sh = `${cmd}; exec bash`;
    child = spawn(term, term === 'gnome-terminal' ? ['--', 'bash', '-c', sh] : ['-e', 'bash', '-c', sh], opts);
  }
  child.on('error', () => {});
  child.unref();
}

module.exports = { launch, installed: () => has('devin') };
