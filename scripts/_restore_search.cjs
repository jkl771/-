const fs = require('fs');
const p = 'app/api/bgm/route.ts';
let s = fs.readFileSync(p, 'utf-8');
s = s.replace('async function searchCcmixter(query: string, limit = 10): Promise<BgmItem[]> {\n  throw new Error("search-entered");\n  try {', 'async function searchCcmixter(query: string, limit = 10): Promise<BgmItem[]> {\n  try {');
fs.writeFileSync(p, s, 'utf-8');
console.log('restored-search');
