/**
 * ASR 服务管理器 - 保持 Python 进程常驻，模型只加载一次
 */

import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import readline from 'readline';

interface ASRRequest {
  action: string;
  share_text?: string;
  url?: string;
  id?: string;
}

interface ASRResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  elapsed?: number;
}

class ASRService {
  private process: ChildProcess | null = null;
  private ready = false;
  private pendingCallbacks: Map<string, (resp: ASRResponse) => void> = new Map();
  private requestId = 0;
  private starting = false;
  private startPromise: Promise<void> | null = null;

  async start(): Promise<void> {
    if (this.ready) return;
    if (this.startPromise) return this.startPromise;

    this.startPromise = new Promise((resolve, reject) => {
      const scriptPath = path.join(process.cwd(), 'services', 'asr_server.py');
      this.process = spawn('python', [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      });

      let initBuffer = '';

      const rl = readline.createInterface({ input: this.process.stdout! });
      
      rl.on('line', (line) => {
        line = line.trim();
        if (!line) return;

        try {
          const msg = JSON.parse(line);

          // 就绪信号
          if (msg.status === 'ready') {
            this.ready = true;
            resolve();
            return;
          }

          // 响应消息
          if (msg.success !== undefined) {
            const callback = this.pendingCallbacks.values().next().value;
            if (callback) {
              const firstKey = this.pendingCallbacks.keys().next().value;
              if (firstKey) this.pendingCallbacks.delete(firstKey);
              callback(msg as ASRResponse);
            }
          }
        } catch {
          // 非 JSON 行忽略
        }
      });

      this.process.stderr?.on('data', () => {}); // 忽略 stderr

      this.process.on('exit', () => {
        this.ready = false;
        this.process = null;
        this.startPromise = null;
        // 拒绝所有等待中的请求
        for (const cb of this.pendingCallbacks.values()) {
          cb({ success: false, error: 'ASR 进程已退出' });
        }
        this.pendingCallbacks.clear();
      });

      this.process.on('error', (err) => {
        reject(err);
      });

      // 超时保护
      setTimeout(() => {
        if (!this.ready) {
          reject(new Error('ASR 服务启动超时'));
        }
      }, 120000);
    });

    return this.startPromise;
  }

  async call(req: ASRRequest): Promise<ASRResponse> {
    await this.start();

    return new Promise((resolve, reject) => {
      const id = `req_${++this.requestId}`;
      this.pendingCallbacks.set(id, resolve);

      try {
        this.process!.stdin!.write(JSON.stringify(req) + '\n');
      } catch (e) {
        this.pendingCallbacks.delete(id);
        reject(new Error('发送请求失败'));
      }

      // 超时保护（5 分钟）
      setTimeout(() => {
        if (this.pendingCallbacks.has(id)) {
          this.pendingCallbacks.delete(id);
          resolve({ success: false, error: '请求超时' });
        }
      }, 300000);
    });
  }

  async stop() {
    if (this.process) {
      this.process.kill();
      this.process = null;
      this.ready = false;
    }
  }
}

// 全局单例
let _service: ASRService | null = null;

export function getASRService(): ASRService {
  if (!_service) {
    _service = new ASRService();
  }
  return _service;
}
