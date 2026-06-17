const fs = require('fs');
const src = 'app/tts/page.tsx';
const text = fs.readFileSync(src, 'utf-8');
fs.writeFileSync('app/tts/page.tsx.bak', text, 'utf-8');
console.log('backed-up', text.length);
