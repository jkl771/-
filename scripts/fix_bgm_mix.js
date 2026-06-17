const fs = require('fs');
let content = fs.readFileSync('C:/Users/HYH/Documents/视频智能体/services/tts-edge.ts', 'utf-8');

// 替换 spawnSync 为 execSync
const oldMix = `try {
      const ffmpegResult = spawnSync('ffmpeg', ffmpegCmd.replace(/^ffmpeg /, '').split(' '), {
        timeout: 30000,
        stdio: 'pipe',
      });
      if (!ffmpegResult.error && ffmpegResult.status === 0) {
        const finalStat = await fs.stat(finalPath);
        if (finalStat.size > 100) outputUrl = '/api/output/videos/' + finalFileName;
      }
    } catch (e) {
      console.warn('[Edge TTS] BGM mix failed, using raw audio:', e);
    }`;

const newMix = `try {
      const { execSync } = require('child_process');
      execSync(ffmpegCmd, { timeout: 30000, stdio: 'pipe' });
      const finalStat = await fs.stat(finalPath);
      if (finalStat.size > 100) outputUrl = '/api/output/videos/' + finalFileName;
    } catch (e) {
      console.warn('[Edge TTS] BGM mix failed, using raw audio:', e);
    }`;

content = content.replace(oldMix, newMix);
fs.writeFileSync('C:/Users/HYH/Documents/视频智能体/services/tts-edge.ts', content, 'utf-8');
console.log('Fixed BGM mix: spawnSync -> execSync');
