const fs = require('fs');
let content = fs.readFileSync('C:/Users/HYH/Documents/视频智能体/app/api/bgm/route.ts', 'utf-8');
// 移除 dynamic 标记
content = content.replace("export const dynamic = 'force-dynamic';\n", '');
fs.writeFileSync('C:/Users/HYH/Documents/视频智能体/app/api/bgm/route.ts', content, 'utf-8');
console.log('Removed dynamic mark');
