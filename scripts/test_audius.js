const fetch = require('node-fetch');

async function searchAudius(query, limit) {
    try {
        const searchUrl = `https://api.audius.co/v1/tracks/search?query=${encodeURIComponent(query)}&app_name=video-agent&limit=${limit}`;
        console.log('URL:', searchUrl);
        const resp = await fetch(searchUrl);
        console.log('Status:', resp.status);
        const data = await resp.json();
        console.log('Data length:', data.data?.length);
        return data.data || [];
    } catch (e) {
        console.log('Error:', e.message);
        return [];
    }
}

searchAudius('chill', 3);
