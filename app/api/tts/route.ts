import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { saveVoiceConfig, listVoiceConfigs } from '@/services/tts';
import { synthesizeEdge, listEdgeVoicePresets } from '@/services/tts-edge';
import { synthesizeSapi } from '@/services/tts-sapi';
import { synthesizeCosyVoice, cloneCosyVoice, listCosyVoicePresets } from '@/services/tts-cosyvoice';
import { synthesizeMinimax, listMinimaxVoices } from '@/services/tts-minimax';
import { synthesizeElevenLabs, cloneElevenLabsVoice, listElevenLabsVoices, getElevenLabsQuota } from '@/services/tts-elevenlabs';
import { synthesizeFish } from '@/services/tts-fish';
import { getDecryptedFishAudioConfig } from '@/services/llm-config';
import { generateSrt } from '@/lib/srt-generator';
import { dashscopeKey, elevenlabsKey } from '@/lib/api-keys';
import { db } from '@/lib/db';

async function saveTempFile(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.cwd(), 'output', 'tmp');
  await fs.mkdir(dir, { recursive: true });
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = path.join(dir, String(Date.now()) + '_' + safeName);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let action: string | undefined;
    let body: Record<string, unknown> = {};
    let sampleFiles: File[] = [];

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      action = String(form.get('action') || '');
      const rawSamples = form.getAll('sample');
      sampleFiles = rawSamples.filter((f): f is File => f instanceof File && f.size > 0);
      form.forEach((v, k) => { if (k !== 'sample' && k !== 'action') body[k] = v; });
    } else {
      const json = await req.json();
      action = json.action;
      body = json;
    }

    const userApiKey = dashscopeKey.get() || undefined;

    if (action === 'probe') {
      const results: Array<{ id: string; label: string; available: boolean; latencyMs?: number; error?: string }> = [];
      const testText = '你好，这是探测测试。';
      const t0Edge = Date.now();
      try {
        await synthesizeEdge({ text: testText, voiceKey: 'xiaoxiao' });
        results.push({ id: 'edge', label: 'Edge TTS（免费预设）', available: true, latencyMs: Date.now() - t0Edge });
      } catch (e: any) {
        results.push({ id: 'edge', label: 'Edge TTS', available: false, error: e.message });
      }
      const cosyCfg = userApiKey ? { baseUrl: '', apiKey: userApiKey } : (() => { const k = dashscopeKey.get(); return k ? { baseUrl: '', apiKey: k } : null; })();
      if (cosyCfg?.apiKey) {
        const t0 = Date.now();
        try {
          await synthesizeCosyVoice({ text: testText, apiKey: userApiKey });
          results.push({ id: 'cosyvoice', label: '阿里云 CosyVoice', available: true, latencyMs: Date.now() - t0 });
        } catch (e: any) {
          results.push({ id: 'cosyvoice', label: '阿里云 CosyVoice', available: false, error: e.message });
        }
      }
      if (cosyCfg?.apiKey) {
        const t0Mini = Date.now();
        try {
          await synthesizeMinimax({ text: testText, apiKey: cosyCfg.apiKey });
          results.push({ id: 'minimax', label: 'MiniMax TTS', available: true, latencyMs: Date.now() - t0Mini });
        } catch (e: any) {
          results.push({ id: 'minimax', label: 'MiniMax TTS', available: false, error: e.message });
        }
      }
      const elKey = elevenlabsKey.get();
      if (elKey) {
        const t0EL = Date.now();
        try {
          await synthesizeElevenLabs({ text: testText, apiKey: elKey });
          results.push({ id: 'elevenlabs', label: 'ElevenLabs（海外高质量）', available: true, latencyMs: Date.now() - t0EL });
        } catch (e: any) {
          results.push({ id: 'elevenlabs', label: 'ElevenLabs', available: false, error: e.message });
        }
      }
      const t0Sapi = Date.now();
      try {
        await synthesizeSapi({ text: testText, voiceKey: 'huihui' });
        results.push({ id: 'sapi', label: '本地 Windows 语音（离线）', available: true, latencyMs: Date.now() - t0Sapi });
      } catch (e: any) {
        results.push({ id: 'sapi', label: '本地 Windows 语音', available: false, error: e.message });
      }
      const firstOk = results.find(r => r.available);
      return NextResponse.json({ success: true, data: { sources: results, recommended: firstOk?.id || null } });
    }

    if (action === 'clone' || action === 'clone_voice') {
      if (sampleFiles.length === 0) return NextResponse.json({ error: '请上传样本音频' }, { status: 400 });
      const samplePaths = [];
      for (const f of sampleFiles) { samplePaths.push(await saveTempFile(f)); }
      const name = String(body.name || '我的音色');
      const cloneTarget = String(body.cloneTarget || 'cosyvoice');
      let voiceId = '';
      if (cloneTarget === 'elevenlabs') {
        const elKey = elevenlabsKey.get();
        if (!elKey) return NextResponse.json({ error: '未配置 ElevenLabs API Key' }, { status: 400 });
        const result = await cloneElevenLabsVoice({ name, samplePath: samplePaths[0], apiKey: elKey });
        voiceId = result.voiceId;
      } else {
        const apiKey = userApiKey || dashscopeKey.get();
        if (!apiKey) return NextResponse.json({ error: '未配置阿里云 API Key' }, { status: 400 });
        const result = await cloneCosyVoice({ name, samplePath: samplePaths[0], apiKey });
        voiceId = result.voiceId;
      }
      const voice = await saveVoiceConfig({ name, voiceId, source: cloneTarget as any, speed: 1, pitch: 0, pauseDuration: 300, emotion: 'neutral' });
      return NextResponse.json({ success: true, data: { voiceId, id: voice.id, source: cloneTarget } });
    }

    if (action === 'synthesize') {
      const source = String(body.source || 'edge');
      const text = String(body.text || '');
      if (!text.trim()) return NextResponse.json({ error: '请输入文案' }, { status: 400 });
        // 解析 BGM 路径：如果是 /bgm/xxx 格式，转为实际文件系统路径
        let bgmFilePath: string | undefined;
        if (body.bgmFile) {
          const bgmVal = String(body.bgmFile);
          if (bgmVal.startsWith('/bgm/')) {
            bgmFilePath = path.join(process.cwd(), 'public', bgmVal);
          } else {
            bgmFilePath = bgmVal;
          }
        }
      try {
        let result: any;
        let autoSwitch = false;
        let autoNote = '';
        if (source === 'edge') {
          const edgeVoiceKey = String(body.voice || body.voiceId || 'xiaoxiao'); const edgeEmotionRaw = String(body.emotion || 'neutral'); const edgeEmotion = edgeEmotionRaw; try {
            result = await synthesizeEdge({ text, voiceKey: edgeVoiceKey, speed: Number(body.speed) || 1, pitch: Number(body.pitch) || 0, emotion: edgeEmotion, bgmFile: bgmFilePath, bgmVolume: Number(body.bgmVolume) || 0.15 });
          } catch (edgeErr: any) {
            console.warn('[TTS] Edge TTS failed, trying fallback:', edgeErr.message);
            try {
              const fbKey = userApiKey || dashscopeKey.get();
              if (fbKey) {
                result = await synthesizeCosyVoice({ text, apiKey: fbKey });
                autoSwitch = true;
                autoNote = 'Edge TTS 失败，已自动切换到阿里云 CosyVoice';
              } else {
                result = await synthesizeSapi({ text, voiceKey: 'huihui' });
                autoSwitch = true;
                autoNote = 'Edge TTS 失败，已自动切换到本地语音';
              }
            } catch (fbErr) {
              throw edgeErr;
            }
          }
        } else if (source === 'cosyvoice') {
          const apiKey = userApiKey || dashscopeKey.get();
          if (!apiKey) {
            result = await synthesizeEdge({ text, voiceKey: 'xiaoxiao' });
            autoSwitch = true;
            autoNote = '未配置 API Key，已自动切换到 Edge TTS';
          } else {
            const cloneList = listVoiceConfigs();
            const firstClone = (cloneList || []).find((v: any) => v.voiceId && v.source === 'cosyvoice');
            if (!body.voiceId && firstClone) { body.voiceId = firstClone.voiceId; autoNote = autoNote || '已自动使用克隆音色'; }
            result = await synthesizeCosyVoice({ text, voiceId: body.voiceId ? String(body.voiceId) : undefined, apiKey });
          }
        } else if (source === 'elevenlabs') {
          const elKey = elevenlabsKey.get();
          if (!elKey) {
            result = await synthesizeEdge({ text, voiceKey: 'xiaoxiao' });
            autoSwitch = true;
            autoNote = '未配置 ElevenLabs Key，已自动切换到 Edge TTS';
          } else {
            result = await synthesizeElevenLabs({ text, voiceId: body.voiceId ? String(body.voiceId) : undefined, apiKey: elKey });
          }
        } else if (source === 'fish') {
          const fishCfg = getDecryptedFishAudioConfig();
          if (!fishCfg) {
            result = await synthesizeEdge({ text, voiceKey: 'xiaoxiao' });
            autoSwitch = true;
            autoNote = 'Fish Audio 未配置，已自动切换到 Edge TTS';
          } else {
            result = await synthesizeFish({ text, voiceId: body.voiceId ? String(body.voiceId) : undefined });
          }
        } else if (source === 'sapi') {
          result = await synthesizeSapi({ text, voiceKey: String(body.voiceId || 'huihui') });
        } else if (source === 'minimax') {
          const minimaxKey = userApiKey || (body.apiKey ? String(body.apiKey) : '');
          if (!minimaxKey) return NextResponse.json({ error: 'MiniMax 需要 API Key，请在设置中配置' }, { status: 400 });
          result = await synthesizeMinimax({ text, apiKey: minimaxKey });
        } else {
          return NextResponse.json({ error: '未知音源: ' + source }, { status: 400 });
        }
        // 对非 edge 音源也支持 BGM 混音
        if (bgmFilePath && source !== 'edge' && result?.audioUrl) {
          try {
            const audioRelPath = result.audioUrl.replace(/^\/api\/output\//, '');
            const audioFullPath = path.join(process.cwd(), 'output', audioRelPath);
            const mixOutPath = audioFullPath.replace(/\.mp3$/, '_bgm.mp3');
            const bgmVol = Number(body.bgmVolume) || 0.3;
            const voiceVol = 1.6;
            const mixCmd = `ffmpeg -y -i "${audioFullPath}" -i "${bgmFilePath}" -filter_complex "[0:a]volume=${voiceVol}[v];[1:a]volume=${bgmVol * 30},aloop=loop=-1:size=2e+09[b];[v][b]amix=inputs=2:duration=shortest:dropout_transition=0:normalize=0" "${mixOutPath}"`;
            const { execSync } = require('child_process');
            execSync(mixCmd, { timeout: 30000, stdio: 'pipe' });
            const mixStat = require('fs').statSync(mixOutPath);
            if (mixStat.size > 100) {
              result.audioUrl = result.audioUrl.replace(/\.mp3$/, '_bgm.mp3');
            }
          } catch (mixErr) {
            console.warn('[TTS] BGM mix failed for ' + source + ':', mixErr);
          }
        }
        // Audio post-processing: loudnorm + fade
        if (result?.audioUrl) {
          try {
            const audioRelPath = result.audioUrl.replace(/^\/api\/output\//, '');
            const audioFullPath = path.join(process.cwd(), 'output', audioRelPath);
            const processedPath = audioFullPath.replace(/\.mp3$/, '_proc.mp3');
            const { execSync } = require('child_process');
            execSync(`ffmpeg -y -i "${audioFullPath}" -af "afade=t=in:st=0:d=0.5,afade=t=out:d=0.8,loudnorm=I=-16:TP=-1.5:LRA=11" "${processedPath}"`, { timeout: 30000, stdio: 'pipe' });
            const procStat = require('fs').statSync(processedPath);
            if (procStat.size > 100) {
              result.audioUrl = result.audioUrl.replace(/\.mp3$/, '_proc.mp3');
            }
          } catch (procErr) {
            console.warn('[TTS] Audio post-process failed:', procErr);
          }
        }
        // SRT subtitle generation
        let srtUrl: string | undefined;
        if (result?.duration && result?.audioUrl) {
          try {
            const srtContent = generateSrt(text, result.duration);
            const audioRelPath2 = result.audioUrl.replace(/^\/api\/output\//, '');
            const audioFullPath2 = path.join(process.cwd(), 'output', audioRelPath2);
            const srtPath = audioFullPath2.replace(/\.[^.]+$/, '.srt');
            require('fs').writeFileSync(srtPath, srtContent, 'utf-8');
            srtUrl = result.audioUrl.replace(/\.[^.]+$/, '.srt');
          } catch {}
        }
        return NextResponse.json({ success: true, data: { ...result, providerUsed: source, autoSwitch, autoNote, srtUrl } });
      } catch (e: any) {
        const errMsg = e.message || '';
        const isCloudError = source !== 'sapi';
        const hint = isCloudError && (errMsg.includes('Insufficient') || errMsg.includes('quota') || errMsg.includes('exceed') || errMsg.includes('Arrearage')) ? ' [额度不足，请在阿里云充值]' : '';
        return NextResponse.json({ success: false, error: errMsg, hint: hint.replace(/[\[\]]/g, '') }, { status: 500 });
      }
    }

    if (action === 'list_el_voices') {
      return NextResponse.json({ success: true, data: listElevenLabsVoices() });
    }

    if (action === 'list_minimax_voices') {
      return NextResponse.json({ success: true, data: listMinimaxVoices() });
    }

    if (action === 'list_cosy_presets') {
      return NextResponse.json({ success: true, data: listCosyVoicePresets() });
    }

    if (action === 'list_clone_voices') {
      const voices = listVoiceConfigs();
      const clonedVoices = (voices as any[]).filter((v) => v.voiceId && (v.source === 'cosyvoice' || v.source === 'elevenlabs'));
      return NextResponse.json({ success: true, data: clonedVoices });
    }

    if (action === 'rename_voice') {
      const id = String(body.id || '');
      const newName = String(body.name || '');
      if (!id || !newName) return NextResponse.json({ error: '缺少 id 或 name' }, { status: 400 });
      const existing = db.voices.get(id) as any;
      if (!existing) return NextResponse.json({ error: '音色不存在' }, { status: 404 });
      existing.name = newName;
      db.voices.save(existing);
      return NextResponse.json({ success: true, data: existing });
    }

    if (action === 'delete_voice') {
      const id = String(body.id || '');
      if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });
      db.voices.delete(id);
      return NextResponse.json({ success: true });
    }

    if (action === 'upload_bgm') {
      if (sampleFiles.length === 0) return NextResponse.json({ error: '请上传音频文件' }, { status: 400 });
      const paths = [];
      for (const f of sampleFiles) { paths.push(await saveTempFile(f)); }
      const bgmPath = paths.join(',');
      return NextResponse.json({ success: true, data: { path: bgmPath, paths, count: paths.length } });
    }

    if (action === 'list_emotions') {
      const { listEmotionPresets } = require('@/services/tts-edge');
      return NextResponse.json({ success: true, data: listEmotionPresets() });
    }

    if (action === 'list_edge_voices') {
      return NextResponse.json({ success: true, data: listEdgeVoicePresets() });
    }

    if (action === 'quota') {
      const apiKey = dashscopeKey.get();
      if (!apiKey) return NextResponse.json({ success: true, data: { hasKey: false, message: '未配置 API Key' } });
      try {
        // 调一次轻量合成探测额度（用极短文本）
        const r = await fetch('https://dashscope.aliyuncs.com/api/v1/services/audio/tts/SpeechSynthesizer', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'cosyvoice-v3-flash', input: { text: 'hi' }, parameters: { voice: 'longanyang', format: 'mp3', sample_rate: 24000 } }),
        });
        if (r.ok) {
          return NextResponse.json({ success: true, data: { hasKey: true, available: true, message: 'API Key 正常，额度充足' } });
        }
        const errText = await r.text();
        let available = false;
        let message = 'API 返回 ' + r.status;
        if (errText.includes('Insufficient') || errText.includes('quota') || errText.includes('exceed') || errText.includes('limit') || errText.includes('billing') || errText.includes('Arrearage')) {
          message = '额度不足或已欠费，请充值后重试';
        } else if (r.status === 401 || r.status === 403) {
          message = 'API Key 无效或已过期';
        } else {
          message = 'API 返回 ' + r.status + ': ' + errText.slice(0, 150);
          available = true; // 非额度问题，可能是参数问题
        }
        return NextResponse.json({ success: true, data: { hasKey: true, available, message } });
      } catch (e: any) {
        return NextResponse.json({ success: true, data: { hasKey: true, available: false, message: '网络错误: ' + e.message } });
      }
    }

    return NextResponse.json({ error: '未知 action: ' + String(action) }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

