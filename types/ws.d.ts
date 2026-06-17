declare module 'ws' {
  import { EventEmitter } from 'events';
  export default class WebSocket extends EventEmitter {
    constructor(address: string | URL, options?: Record<string, unknown>);
    send(data: unknown, cb?: (err?: Error) => void): void;
    close(code?: number, reason?: string): void;
    on(event: 'open', listener: () => void): this;
    on(event: 'message', listener: (data: Buffer | string) => void): this;
    on(event: 'error', listener: (err: unknown) => void): this;
    on(event: 'close', listener: () => void): this;
  }
}