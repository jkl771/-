const fs = require('fs');
let content = fs.readFileSync('C:/Users/HYH/Documents/视频智能体/app/api/bgm/route.ts', 'utf-8');

// 替换 GET 函数里的 Audius 搜索部分
const oldAudius = `if ((source === 'audius' || source === 'all') && query) {
      console.log('[BGM] Searching Audius for:', query, 'source:', source, 'limit:', limit);
      const audiusResults = await searchAudius(query, limit);
      results.push(...audiusResults);
    }`;

const newAudius = `if ((source === 'audius' || source === 'all') && query) {
      console.log('[BGM] Searching Audius for:', query, 'source:', source, 'limit:', limit);
      try {
        const nodeFetch = (await import('node-fetch')).default;
        const searchUrl = 'https://api.audius.co/v1/tracks/search?query=' + encodeURIComponent(query) + '&app_name=video-agent&limit=' + limit;
        console.log('[BGM] Audius URL:', searchUrl);
        const resp = await nodeFetch(searchUrl);
        console.log('[BGM] Audius status:', resp.status);
        const data = await resp.json();
        console.log('[BGM] Audius data length:', data.data?.length);
        if (data.data && Array.isArray(data.data)) {
          const audiusResults = data.data.map((track) => ({
            id: 'audius_' + track.id,
            name: track.title || 'Unknown',
            category: track.genre || '在线',
            source: 'audius',
            url: 'https://api.audius.co/v1/tracks/' + track.id + '/stream?app_name=video-agent',
            artist: track.user?.name || '',
            tags: (track.tags || []).filter(Boolean).slice(0, 6),
          }));
          results.push(...audiusResults);
        }
      } catch (e) {
        console.error('[BGM] Audius search error:', e);
      }
    }`;

if (content.includes(oldAudius)) {
    content = content.replace(oldAudius, newAudius);
    console.log('Replaced Audius search logic');
} else {
    console.log('Old Audius logic not found');
}

fs.writeFileSync('C:/Users/HYH/Documents/视频智能体/app/api/bgm/route.ts', content, 'utf-8');
console.log('Done');
