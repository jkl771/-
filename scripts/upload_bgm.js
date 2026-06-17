const fs = require('fs');
const path = require('path');

// 上传自定义 BGM
async function uploadBgm(file, name) {
    const bgmDir = path.join(process.cwd(), 'public', 'bgm', 'library');
    await fs.promises.mkdir(bgmDir, { recursive: true });
    
    const ext = path.extname(file.name) || '.mp3';
    const safeName = (name || file.name).replace(/[^a-zA-Z0-9._\u4e00-\u9fff]/g, '_');
    const fileName = Date.now() + '_' + safeName + ext;
    const filePath = path.join(bgmDir, fileName);
    
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.promises.writeFile(filePath, buffer);
    
    return {
        id: 'lib_' + fileName,
        name: name || file.name,
        category: '自定义',
        source: 'library',
        url: '/bgm/library/' + fileName,
    };
}

module.exports = { uploadBgm };
