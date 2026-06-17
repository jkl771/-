$locked='C:\Users\HYH\Documents\视频智能体\public\bgm\library\1781534318275_Easter_Light.mp3'
$handles=Get-Process | Where-Object { try { $_.Modules.FileName -eq $locked } catch { $false } }
Write-Output ($handles | Select-Object Id,ProcessName | Out-String)