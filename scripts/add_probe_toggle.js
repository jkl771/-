const fs = require('fs');
let content = fs.readFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx', 'utf-8');

// 1. 添加 showProbe state
if (!content.includes('showProbe')) {
    content = content.replace(
        'const [probing, setProbing] = useState(false);',
        'const [probing, setProbing] = useState(false); const [showProbe, setShowProbe] = useState(false);'
    );
    console.log('Added showProbe state');
}

// 2. 修改探测按钮：toggle showProbe
const oldProbe = 'onClick={handleProbe} disabled={probing}';
const newProbe = 'onClick={() => { if (showProbe) { setShowProbe(false); } else { setShowProbe(true); handleProbe(); } }} disabled={probing}';
if (content.includes(oldProbe)) {
    content = content.replace(oldProbe, newProbe);
    console.log('Fixed probe toggle');
}

// 3. 修改探测结果：包裹在 showProbe 条件里
const oldResults = '{probeResults.length > 0 && (';
const newResults = '{showProbe && probeResults.length > 0 && (';
if (content.includes(oldResults)) {
    content = content.replace(oldResults, newResults);
    console.log('Fixed probe results visibility');
}

// 4. 修改探测按钮文字
const oldProbeText = "{probing ? '探测中...' : '探测可用音源'}";
const newProbeText = "{probing ? '探测中...' : showProbe ? '收起探测' : '探测可用音源'}";
if (content.includes(oldProbeText)) {
    content = content.replace(oldProbeText, newProbeText);
    console.log('Fixed probe button text');
}

fs.writeFileSync('C:/Users/HYH/Documents/视频智能体/app/tts/page.tsx', content, 'utf-8');
console.log('Done');
