const fs = require('fs');
let content = fs.readFileSync('C:/Users/HYH/Documents/视频智能体/app/api/bgm/route.ts', 'utf-8');

content = content.replace(
    "if ((source === 'audius' || source === 'all') && query) {",
    "if ((source === 'audius' || source === 'all') && query) { console.log('[BGM] Searching Audius for:', query);"
);

fs.writeFileSync('C:/Users/HYH/Documents/视频智能体/app/api/bgm/route.ts', content, 'utf-8');
console.log('Added log');
