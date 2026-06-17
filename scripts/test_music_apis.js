const fetch = require('node-fetch');

async function testFreeMusicAPIs() {
    console.log('Testing free music APIs...');
    
    // 1. 尝试 Pixabay Music API（免费，无需 key）
    try {
        const r = await fetch('https://pixabay.com/api/music/?key=&q=chill&per_page=3');
        console.log('Pixabay API:', r.status);
    } catch (e) {
        console.log('Pixabay API error:', e.message);
    }
    
    // 2. 尝试 Freesound API（需要 key）
    try {
        const r = await fetch('https://freesound.org/apiv2/search/text/?query=chill&token=test');
        console.log('Freesound API:', r.status);
    } catch (e) {
        console.log('Freesound API error:', e.message);
    }
    
    // 3. 尝试直接下载免费音乐
    const freeMusicUrls = [
        'https://www.bensound.com/bensound-music/bensound-creativeminds.mp3',
        'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
        'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
    ];
    
    for (const url of freeMusicUrls) {
        try {
            const r = await fetch(url, { method: 'HEAD' });
            console.log('URL:', url.split('/').pop(), 'Status:', r.status, 'Type:', r.headers.get('content-type'));
        } catch (e) {
            console.log('URL:', url.split('/').pop(), 'Error:', e.message);
        }
    }
}

testFreeMusicAPIs();
