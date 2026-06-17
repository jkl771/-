/**
 * 本地 LLM 服务管理器 - 保持 Python 进程常驻，模型只加载一次
 */

import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import readline from 'readline';

interface LLMRequest {
  action: string;
  system?: string;
  prompt?: string;
  max_tokens?: number;
  temperature?: number;
}

interface LLMResponse {
  success: boolean;
  data?: {
    text?: string;
    gen_time?: number;
    status?: string;
  };
  error?: string;
  elapsed?: number;
}

class LLMService {
  private process: ChildProcess | null = null;
  private ready = false;
  private pendingCallbacks: Map<string, (resp: LLMResponse) => void> = new Map();
  private requestId = 0;
  private startPromise: Promise<void> | null = null;

  async start(): Promise<void> {
    if (this.ready) return;
    if (this.startPromise) return this.startPromise;

    this.startPromise = new Promise((resolve, reject) => {
      const scriptPath = path.join(process.cwd(), 'services', 'llm_server.py');
      this.process = spawn('python', [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      });

      const rl = readline.createInterface({ input: this.process.stdout! });
      
      rl.on('line', (line) => {
        line = line.trim();
        if (!line) return;

        try {
          const msg = JSON.parse(line);

          if (msg.status === 'ready') {
            this.ready = true;
            resolve();
            return;
          }

          if (msg.success !== undefined) {
            const callback = this.pendingCallbacks.values().next().value;
            if (callback) {
              const firstKey = this.pendingCallbacks.keys().next().value;
              if (firstKey) this.pendingCallbacks.delete(firstKey);
              callback(msg as LLMResponse);
            }
          }
        } catch {
          // 非 JSON 行忽略
        }
      });

      this.process.stderr?.on('data', () => {});

      this.process.on('exit', () => {
        this.ready = false;
        this.process = null;
        this.startPromise = null;
        for (const cb of this.pendingCallbacks.values()) {
          cb({ success: false, error: 'LLM 进程已退出' });
        }
        this.pendingCallbacks.clear();
      });

      this.process.on('error', (err) => {
        reject(err);
      });

      setTimeout(() => {
        if (!this.ready) {
          reject(new Error('LLM 服务启动超时'));
        }
      }, 120000);
    });

    return this.startPromise;
  }

  async call(req: LLMRequest): Promise<LLMResponse> {
    await this.start();

    return new Promise((resolve, reject) => {
      const id = `req_${++this.requestId}`;
      this.pendingCallbacks.set(id, resolve);

      try {
        this.process!.stdin!.write(JSON.stringify(req, null, 0) + '\n');
      } catch (e) {
        this.pendingCallbacks.delete(id);
        reject(new Error('发送请求失败'));
      }

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

let _service: LLMService | null = null;

export function getLLMService(): LLMService {
  if (!_service) {
    _service = new LLMService();
  }
  return _service;
}
