// 02-Tests/io-rendering/console-renderer.test.ts
import { describe, expect, test } from 'bun:test';
import { render, unmountRenderer } from '../../01-Source-code/io-rendering/ConsoleRenderer';
import { mockRenderSnapshot } from '../../01-Source-code/shared/mock-engine';
import type { RenderSnapshot } from '../../01-Source-code/shared/types';

describe('ConsoleRenderer (ConsoleRenderer.ts)', () => {
  test('render() แสดงผลกระดานและข้อมูลเกมโดยไม่เกิด error', () => {
    const logs: string[] = [];
    const originalWrite = process.stdout.write;

    process.stdout.write = ((chunk: string | Uint8Array) => {
      logs.push(String(chunk));
      return true;
    }) as typeof process.stdout.write;

    try {
      const snapshot: RenderSnapshot = {
        ...mockRenderSnapshot,
        score: 1500,
        level: 3,
        status: 'playing',
      };

      expect(() => {
        render(snapshot);
        unmountRenderer();
      }).not.toThrow();

      const output = logs.join('\n');
      expect(output).toContain('╔');
      expect(output).toContain('┼──');
      expect(output).toContain('Score: 1500');
      expect(output).toContain('Level: 3');
      expect(output).toContain('NEXT');
      expect(output).toContain('Move Left');
    } finally {
      unmountRenderer();
      process.stdout.write = originalWrite;
    }
  });

  test('render() แสดงสถานะ === PAUSED === เมื่อเกมถูกพัก', () => {
    const logs: string[] = [];
    const originalWrite = process.stdout.write;

    process.stdout.write = ((chunk: string | Uint8Array) => {
      logs.push(String(chunk));
      return true;
    }) as typeof process.stdout.write;

    try {
      const snapshot: RenderSnapshot = {
        ...mockRenderSnapshot,
        status: 'paused',
      };

      render(snapshot);
      unmountRenderer();
      const output = logs.join('\n');
      expect(output).toContain('=== PAUSED ===');
    } finally {
      unmountRenderer();
      process.stdout.write = originalWrite;
    }
  });

  test('render() แสดงสถานะ === GAME OVER === เมื่อจบเกม', () => {
    const logs: string[] = [];
    const originalWrite = process.stdout.write;

    process.stdout.write = ((chunk: string | Uint8Array) => {
      logs.push(String(chunk));
      return true;
    }) as typeof process.stdout.write;

    try {
      const snapshot: RenderSnapshot = {
        ...mockRenderSnapshot,
        status: 'gameover',
      };

      render(snapshot);
      unmountRenderer();
      const output = logs.join('\n');
      expect(output).toContain('=== GAME OVER ===');
    } finally {
      unmountRenderer();
      process.stdout.write = originalWrite;
    }
  });
});
