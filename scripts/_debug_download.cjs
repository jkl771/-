const {execSync}=require('child_process');
const path=require('path');
const os=require('os');
const fs=require('fs');
const url='https://ccmixter.org/content/NiGiD/NiGiD_-_Chillermore_Groove.mp3';
const tempFile=path.join(os.tmpdir(),'bgm_'+Date.now()+'.mp3');
const s=path.join('C:/Users/HYH/Documents/视频智能体/scripts','download_ccmixter.py');
try {
  console.log(execSync(`python "${s}" "${url}" "${tempFile}"`, {timeout:180000, stdio:['ignore','pipe','pipe']}).toString());
} catch (e) {
  console.error('exec failed', e.stderr?.toString?.(), e.message);
}
console.log('tempFile', tempFile, fs.existsSync(tempFile), fs.existsSync(tempFile)?fs.statSync(tempFile).size:0);