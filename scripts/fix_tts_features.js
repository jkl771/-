const fs = require('fs');
let content = fs.readFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx', 'utf-8');

// 1. 在克隆区添加 API Key 说明框
const cloneSection = '🧬 声音克隆';
if (content.includes(cloneSection) && !content.includes('什么是 API Key')) {
    const apiKey说明 = `
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 space-y-1">
              <div className="font-semibold">💡 什么是 API Key？</div>
              <div>API Key 是阿里云的访问密钥，一个 Key 可用于：声音克隆 + 语音合成 + 数字人口型。</div>
              <div>👉 <a className="text-blue-600 underline" href="https://bailian.console.aliyun.com/cn-beijing?tab=globalset#/efm/api_key" target="_blank">点击这里获取 DashScope API Key</a></div>
              <div className="text-blue-500">获取后粘贴到下方「配置 Key」即可，系统会加密存储。</div>
            </div>`;
    content = content.replace(
        '上传一段清晰人声，AI 自动克隆音色并可用于合成。',
        '上传一段清晰人声，AI 自动克隆音色并可用于合成。' + apiKey说明
    );
    console.log('Added API Key 说明框');
}

// 2. 在 synthResult 区域添加 autoNote 和 providerUsed
if (!content.includes('autoNote')) {
    // 修改 synthResult state 类型
    content = content.replace(
        '{ audioUrl: string; duration?: number }',
        '{ audioUrl: string; duration?: number; providerUsed?: string; autoSwitch?: boolean; autoNote?: string }'
    );
    console.log('Updated synthResult type');
    
    // 在生成成功 badge 后添加 autoNote 提示
    const oldResult = '<Badge variant="success">✅ 生成成功</Badge>';
    const newResult = `<Badge variant="success">✅ 生成成功</Badge>
                  {synthResult?.autoSwitch && <span className="text-xs text-amber-600 ml-2">⚠️ {synthResult.autoNote || '已自动切换音源'}</span>}
                  {synthResult?.autoNote && !synthResult.autoSwitch && <span className="text-xs text-blue-600 ml-2">ℹ️ {synthResult.autoNote}</span>}
                  <span className="text-xs text-gray-500 ml-2">音源: {synthResult?.providerUsed || ttsMode}</span>`;
    if (content.includes(oldResult)) {
        content = content.replace(oldResult, newResult);
        console.log('Added autoNote display');
    }
}

fs.writeFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx', content, 'utf-8');
console.log('Done');
