const fs = require('fs');
let content = fs.readFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx', 'utf-8');

// 在克隆区描述后添加 API Key 说明框
const oldDesc = '上传一段清晰人声，AI 自动克隆音色并可用于合成。</p>';
const newDesc = `上传一段清晰人声，AI 自动克隆音色并可用于合成。</p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 space-y-1">
              <div className="font-semibold">💡 什么是 API Key？</div>
              <div>API Key 是阿里云的访问密钥，一个 Key 可用于：声音克隆 + 语音合成 + 数字人口型。</div>
              <div>👉 <a className="text-blue-600 underline" href="https://bailian.console.aliyun.com/cn-beijing?tab=globalset#/efm/api_key" target="_blank">点击这里获取 DashScope API Key</a></div>
              <div className="text-blue-500">获取后粘贴到下方「配置 Key」即可，系统会加密存储。</div>
            </div>`;

if (content.includes(oldDesc)) {
    content = content.replace(oldDesc, newDesc);
    console.log('Added API Key 说明框');
} else {
    console.log('Old desc not found');
}

fs.writeFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx', content, 'utf-8');
console.log('Done');
