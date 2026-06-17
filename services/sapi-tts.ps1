param(
  [string]$Text,
  [string]$Voice = 'Microsoft Huihui Desktop',
  [string]$OutputPath
)
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice($Voice)
$synth.SetOutputToWaveFile($OutputPath)
$synth.Speak($Text)
$synth.SetOutputToNull()
Write-Output "OK"