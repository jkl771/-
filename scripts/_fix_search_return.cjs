const fs = require('fs');
const p = 'app/api/bgm/route.ts';
let s = fs.readFileSync(p, 'utf-8');
const old = '    const result = runPythonScript(code, [ccMixterUrl]); throw new Error(result.toString("utf-8").slice(0, 800)); throw new Error(result.toString("utf-8").slice(0, 500));';
const upd = '    const result = runPythonScript(code, [ccMixterUrl]);\n    const raw = result.toString("utf-8").trim();\n    const parsed = JSON.parse(raw);\n    if (!Array.isArray(parsed)) return [];\n    return parsed.map((item: any) => ({\n      id: item.id,\n      name: item.name,\n      category: "在线",\n      source: "ccmixter",\n      url: item.url,\n      artist: item.artist,\n      tags: (item.tags || []).filter(Boolean).slice(0, 6),\n    }));';
s = s.replace(old, upd);
fs.writeFileSync(p, s, 'utf-8');
console.log('search-return-mapped');
