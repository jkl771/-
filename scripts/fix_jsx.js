const fs = require('fs');
let content = fs.readFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx', 'utf-8');

// 修复 1: 移除多余的 "r."
content = content.replace('<div className="r.font-medium text-gray-800">', '<div className="font-medium text-gray-800">');

// 修复 2: 修复 Badge 标签闭合
content = content.replace(
    '<Badge variant={r.available ? \'success\' : \'default\'}>{r.available ? \'可用\' : \'不可用\'}</div>',
    '<Badge variant={r.available ? \'success\' : \'default\'}>{r.available ? \'可用\' : \'不可用\'}</Badge>'
);

fs.writeFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx', content, 'utf-8');
console.log('Fixed JSX errors');
