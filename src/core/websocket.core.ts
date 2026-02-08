/**
 * WebSocket helper for ThanhHoaJS
 * Wrapper around Bun's native WebSocket server
 */

import type { ServerWebSocket, WebSocketHandler } from 'bun';

export interface WebSocketData {
  id: string;
  [key: string]: any;
}

export interface WebSocketConfig<T = WebSocketData> {
  /** Called when connection opens */
  open?: (ws: ServerWebSocket<T>) => void | Promise<void>;

  /** Called when message received */
  message?: (
    ws: ServerWebSocket<T>,
    message: string | Buffer,
  ) => void | Promise<void>;

  /** Called when connection closes */
  close?: (
    ws: ServerWebSocket<T>,
    code: number,
    reason: string,
  ) => void | Promise<void>;

  /** Called when backpressure drains */
  drain?: (ws: ServerWebSocket<T>) => void | Promise<void>;

  /** Called for ping */
  ping?: (ws: ServerWebSocket<T>, data: Buffer) => void | Promise<void>;

  /** Called for pong */
  pong?: (ws: ServerWebSocket<T>, data: Buffer) => void | Promise<void>;

  /** Max payload size in bytes (default: 16MB) */
  maxPayloadLength?: number;

  /** Idle timeout in seconds (default: 120) */
  idleTimeout?: number;

  /** Enable per-message deflate compression */
  perMessageDeflate?: boolean;

  /** Backpressure limit in bytes */
  backpressureLimit?: number;
}

/**
 * WebSocket route storage
 */
export class WebSocketRouter {
  private routes = new Map<string, WebSocketConfig>();

  /**
   * Register a WebSocket route
   */
  ws<T = WebSocketData>(path: string, config: WebSocketConfig<T>): this {
    this.routes.set(path, config as WebSocketConfig);
    return this;
  }

  /**
   * Get WebSocket config for path
   */
  getConfig(path: string): WebSocketConfig | undefined {
    return this.routes.get(path);
  }

  /**
   * Check if path is a WebSocket route
   */
  isWebSocketRoute(path: string): boolean {
    return this.routes.has(path);
  }

  /**
   * Get all WebSocket routes
   */
  getRoutes(): Map<string, WebSocketConfig> {
    return this.routes;
  }

  /**
   * Create Bun WebSocket handler
   */
  createHandler(): WebSocketHandler<WebSocketData> {
    const routes = this.routes;

    return {
      open(ws: ServerWebSocket<WebSocketData>) {
        const config = routes.get(ws.data?.path || '/');
        config?.open?.(ws);
      },
      message(ws: ServerWebSocket<WebSocketData>, message: string | Buffer) {
        const config = routes.get(ws.data?.path || '/');
        config?.message?.(ws, message);
      },
      close(ws: ServerWebSocket<WebSocketData>, code: number, reason: string) {
        const config = routes.get(ws.data?.path || '/');
        config?.close?.(ws, code, reason);
      },
      drain(ws: ServerWebSocket<WebSocketData>) {
        const config = routes.get(ws.data?.path || '/');
        config?.drain?.(ws);
      },
      ping(ws: ServerWebSocket<WebSocketData>, data: Buffer) {
        const config = routes.get(ws.data?.path || '/');
        config?.ping?.(ws, data);
      },
      pong(ws: ServerWebSocket<WebSocketData>, data: Buffer) {
        const config = routes.get(ws.data?.path || '/');
        config?.pong?.(ws, data);
      },
    };
  }
}

/**
 * Generate unique WebSocket connection ID
 */
export const generateWsId = (): string => {
  return Math.random().toString(36).slice(2, 11);
};
