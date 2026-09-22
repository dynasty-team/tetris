// 02-Tests/io-rendering/console-renderer.test.ts
import { describe, expect, test } from 'bun:test';
import { render } from '../../01-Source-code/io-rendering/ConsoleRenderer';
import { mockRenderSnapshot } from '../../01-Source-code/shared/mock-engine';
import type { RenderSnapshot } from '../../01-Source-code/shared/types';

describe('ConsoleRenderer (ConsoleRenderer.ts)', () => {
  test('render() แสดงผลกระดานและข้อมูลเกมโดยไม่เกิด error', () => {
    const logs: string[] = [];
    const originalLog = console.log;
    const originalClear = console.clear;

    console.log = (...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    };
    console.clear = () => {};

    try {
      const snapshot: RenderSnapshot = {
        ...mockRenderSnapshot,
        score: 1500,
        level: 3,
        status: 'playing',
      };

      expect(() => render(snapshot)).not.toThrow();

      const output = logs.join('\n');
      expect(output).toContain('+----------+');
      expect(output).toContain('Score: 1500');
      expect(output).toContain('Level: 3');
      expect(output).toContain('Next:');
      expect(output).toContain('Controls:');
    } finally {
      console.log = originalLog;
      console.clear = originalClear;
    }
  });

  test('render() แสดงสถานะ === PAUSED === เมื่อเกมถูกพัก', () => {
    const logs: string[] = [];
    const originalLog = console.log;
    const originalClear = console.clear;

    console.log = (...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    };
    console.clear = () => {};

    try {
      const snapshot: RenderSnapshot = {
        ...mockRenderSnapshot,
        status: 'paused',
      };

      render(snapshot);
      const output = logs.join('\n');
      expect(output).toContain('=== PAUSED ===');
    } finally {
      console.log = originalLog;
      console.clear = originalClear;
    }
  });

  test('render() แสดงสถานะ === GAME OVER === เมื่อจบเกม', () => {
    const logs: string[] = [];
    const originalLog = console.log;
    const originalClear = console.clear;

    console.log = (...args: unknown[]) => {
      logs.push(args.map(String).join(' '));
    };
    console.clear = () => {};

    try {
      const snapshot: RenderSnapshot = {
        ...mockRenderSnapshot,
        status: 'gameover',
      };

      render(snapshot);
      const output = logs.join('\n');
      expect(output).toContain('=== GAME OVER ===');
    } finally {
      console.log = originalLog;
      console.clear = originalClear;
    }
  });
});
