const fs = require('fs');
const p = 'app/api/bgm/route.ts';
let s = fs.readFileSync(p, 'utf-8');
const start = s.indexOf('function runPythonScript(code: string, args: string[] = [], timeout = 15000) {');
const end = s.indexOf('\n}\n', start) + 3;
const newFn = `function runPythonScript(code: string, args: string[] = [], timeout = 15000) {
  const { execSync } = require('child_process');
  const fsSync = require('fs');
  const os = require('os');
  const scriptPath = path.join(os.tmpdir(), 'bgm_' + Date.now() + '.py');
  const argLines = args.map((a, i) => 'a' + i + ' = sys.argv[' + (i+1) + ']').join('\\n');
  const full = 'import sys\\n' + argLines + '\\n\\n' + code;
  fsSync.writeFileSync(scriptPath, full, 'utf8');
  try {
    const cmd = 'python "' + scriptPath + '" ' + args.map(a => '"' + a.replace(/"/g, '\\\\"') + '"').join(' ');
    return execSync(cmd, { timeout, stdio: ['pipe','pipe','pipe'], env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
  } finally {
    try { fsSync.unlinkSync(scriptPath); } catch {}
  }
}
`;
s = s.slice(0, start) + newFn + s.slice(end);
fs.writeFileSync(p, s, 'utf-8');
console.log('runner-fixed-fssync');
