// 02-Tests/io-rendering/keyboard-input.test.ts
import { describe, expect, test } from 'bun:test';
import {
  KeyboardInput,
  type InputStream,
  type TerminalRawMode,
  type MenuKeyboardAction,
  type KeyboardAction,
} from '../../01-Source-code/io-rendering/KeyboardInput';
import type { GameAction } from '../../01-Source-code/shared/types';

class MockInputStream implements InputStream {
  private chunks: Uint8Array[] = [];
  private cancelled = false;

  constructor(inputs: string[]) {
    const encoder = new TextEncoder();
    this.chunks = inputs.map((s) => encoder.encode(s));
  }

  public stream() {
    return {
      getReader: () => ({
        read: async () => {
          if (this.cancelled || this.chunks.length === 0) {
            return { done: true, value: undefined };
          }
          const value = this.chunks.shift()!;
          return { done: false, value };
        },
        cancel: async () => {
          this.cancelled = true;
        },
      }),
    };
  }
}

describe('KeyboardInput (KeyboardInput.ts)', () => {
  test('แปลงปุ่มตัวอักษรเป็น GameAction ได้ถูกต้อง (a, d, s, w, space, p, q)', async () => {
    const actions: GameAction[] = [];
    const mockInput = new MockInputStream(['a', 'd', 's', 'w', ' ', 'p', 'q']);
    const mockTerminal: TerminalRawMode = {
      isTTY: true,
      setRawMode: () => { },
    };

    const keyboard = new KeyboardInput({
      input: mockInput,
      terminal: mockTerminal,
    });

    keyboard.start((action) => {
      actions.push(action);
    });

    // รอ async reader ประมวลผล
    await new Promise((r) => setTimeout(r, 30));

    expect(actions).toEqual([
      'MOVE_LEFT',
      'MOVE_RIGHT',
      'SOFT_DROP',
      'ROTATE',
      'HARD_DROP',
      'PAUSE',
      'QUIT',
    ]);

    keyboard.stop();
  });

  test('แปลง ANSI Escape Sequences ของปุ่มลูกศรได้ถูกต้อง', async () => {
    const actions: GameAction[] = [];
    // Up, Down, Left, Right arrows
    const mockInput = new MockInputStream(['\u001b[A', '\u001b[B', '\u001b[D', '\u001b[C']);
    const mockTerminal: TerminalRawMode = {
      isTTY: true,
      setRawMode: () => { },
    };

    const keyboard = new KeyboardInput({
      input: mockInput,
      terminal: mockTerminal,
    });

    keyboard.start((action) => {
      actions.push(action);
    });

    await new Promise((r) => setTimeout(r, 30));

    expect(actions).toEqual([
      'ROTATE',
      'SOFT_DROP',
      'MOVE_LEFT',
      'MOVE_RIGHT',
    ]);

    keyboard.stop();
  });


  test('Q และ ESC แปลงเป็น QUIT เพื่อออกจากเกมกลับ Main Menu', async () => {
    const actions: KeyboardAction[] = [];
    const mockInput = new MockInputStream(['q', '\u001b']);
    const mockTerminal: TerminalRawMode = {
      isTTY: true,
      setRawMode: () => { },
    };

    const keyboard = new KeyboardInput({
      input: mockInput,
      terminal: mockTerminal,
    });

    keyboard.start((action) => {
      actions.push(action);
    }, 'game');

    await new Promise((r) => setTimeout(r, 30));

    expect(actions).toEqual(['QUIT', 'QUIT']);
    keyboard.stop();
  });

  test('รองรับ action ของเมนูด้วย KeyboardInput ตัวเดียวกัน', async () => {
    const actions: MenuKeyboardAction[] = [];
    const mockInput = new MockInputStream(['w', 's', '\r', 'q']);
    const mockTerminal: TerminalRawMode = {
      isTTY: true,
      setRawMode: () => { },
    };

    const keyboard = new KeyboardInput({
      input: mockInput,
      terminal: mockTerminal,
    });

    keyboard.start((action) => {
      actions.push(action as MenuKeyboardAction);
    }, 'menu');

    await new Promise((r) => setTimeout(r, 30));

    expect(actions).toEqual(['UP', 'DOWN', 'CONFIRM', 'QUIT']);
    keyboard.stop();
  });

  test('stop() ตัด input session แต่ไม่ปิด raw mode ระหว่างเปลี่ยนหน้า', () => {
    const mockInput = new MockInputStream([]);
    const modes: boolean[] = [];
    const mockTerminal: TerminalRawMode = {
      isTTY: true,
      setRawMode: (mode) => modes.push(mode),
    };
    const keyboard = new KeyboardInput({ input: mockInput, terminal: mockTerminal });

    keyboard.start(() => { });
    keyboard.stop();

    expect(modes).toEqual([true]);

    keyboard.releaseTerminal();
    expect(modes).toEqual([true, false]);
  });

  test('release() คืน raw mode หลังจบ input session จริง', () => {
    const mockInput = new MockInputStream([]);
    const modes: boolean[] = [];
    const mockTerminal: TerminalRawMode = {
      isTTY: true,
      setRawMode: (mode) => modes.push(mode),
    };
    const keyboard = new KeyboardInput({ input: mockInput, terminal: mockTerminal });

    expect(() => {
      keyboard.start(() => { });
      keyboard.release();
      keyboard.stop(); // เรียกซ้ำได้ไม่ crash
    }).not.toThrow();

    expect(modes).toEqual([true, false]);
  });

  test('KeyboardInput ตัวเดิมสามารถ stop แล้ว start ใหม่สำหรับเกมรอบถัดไปได้', async () => {
    const actions: KeyboardAction[] = [];
    const mockInput = new MockInputStream(['a']);
    const mockTerminal: TerminalRawMode = {
      isTTY: true,
      setRawMode: () => { },
    };
    const keyboard = new KeyboardInput({
      input: mockInput,
      terminal: mockTerminal,
    });

    keyboard.start((action) => actions.push(action), 'game');
    await new Promise((r) => setTimeout(r, 10));
    keyboard.stop();

    // mock stream นี้ส่งข้อมูลตาม queue; การ start ใหม่ต้องไม่ทำให้ KeyboardInput
    // อยู่ในสถานะ stopped ถาวร และ callback ใหม่ต้องถูกติดตั้งได้
    const secondActions: KeyboardAction[] = [];
    keyboard.start((action) => secondActions.push(action), 'game');
    await new Promise((r) => setTimeout(r, 10));
    keyboard.stop();

    expect(actions).toEqual(['MOVE_LEFT']);
    expect(secondActions).toEqual([]);
  });

});
