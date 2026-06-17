@echo off 
chcp 65001 >nul 
cd /d C:\Users\HYH\Documents\视频智能体 
echo 正在启动视频智能体... 
start http://localhost:3000 
npm run dev 
pause
