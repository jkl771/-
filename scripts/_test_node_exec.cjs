const {execSync}=require('child_process');
const path=require('path');
const fs=require('fs');
const url='https://ccmixter.org/content/NiGiD/NiGiD_-_Chillermore_Groove.mp3';
const out='C:/Users/HYH/Documents/视频智能体/public/bgm/library/_test_node.mp3';
const s=path.join('C:/Users/HYH/Documents/视频智能体/scripts','download_ccmixter.py');
console.log(execSync(`python "${s}" "${url}" "${out}"`, {timeout:180000}).toString());
console.log(fs.statSync(out).size);