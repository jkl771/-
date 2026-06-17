const fs = require('fs');
const p = 'app/api/bgm/route.ts';
let s = fs.readFileSync(p, 'utf-8');
const old = 'async function searchCcmixter(query: string, limit = 10): Promise<BgmItem[]> {\n  try {';
const upd = 'async function searchCcmixter(query: string, limit = 10): Promise<BgmItem[]> {\n  throw new Error("search-entered");\n  try {';
s = s.replace(old, upd);
fs.writeFileSync(p, s, 'utf-8');
console.log('enter-throw');
