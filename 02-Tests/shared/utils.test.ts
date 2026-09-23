// 02-Tests/shared/utils.test.ts
import { describe, expect, test } from 'bun:test';
import { pipe, shuffle } from '../../01-Source-code/shared/utils';

describe('pipe() - Higher-order function', () => {
  test('เรียกฟังก์ชันตามลำดับจากซ้ายไปขวา (left-to-right)', () => {
    const addOne = (x: number) => x + 1;
    const double = (x: number) => x * 2;
    const subtractFive = (x: number) => x - 5;

    // (3 + 1) * 2 - 5 = 4 * 2 - 5 = 8 - 5 = 3
    const pipeline = pipe(addOne, double, subtractFive);
    expect(pipeline(3)).toBe(3);

    // ลำดับการคำนวณต้องซ้ายไปขวา: double แล้วค่อย addOne
    // (3 * 2) + 1 = 7
    const reverseOrder = pipe(double, addOne);
    expect(reverseOrder(3)).toBe(7);
  });

  test('รองรับการทำงานกับฟังก์ชันเดียว', () => {
    const square = (n: number) => n * n;
    const pipeline = pipe(square);
    expect(pipeline(4)).toBe(16);
  });

  test('รองรับกรณีไม่มีฟังก์ชันส่งเข้ามา (identity function)', () => {
    const identity = pipe<number>();
    expect(identity(42)).toBe(42);

    const identityString = pipe<string>();
    expect(identityString('tetris')).toBe('tetris');
  });

  test('ทำงานกับ Object Transformation ในบริบท Game State ได้ถูกต้อง', () => {
    interface TestGameState {
      score: number;
      lines: number;
      level: number;
    }

    const addScore = (amount: number) => (state: TestGameState): TestGameState => ({
      ...state,
      score: state.score + amount,
    });

    const addLines = (count: number) => (state: TestGameState): TestGameState => ({
      ...state,
      lines: state.lines + count,
    });

    const checkLevelUp = (state: TestGameState): TestGameState => ({
      ...state,
      level: Math.floor(state.lines / 10) + 1,
    });

    const processLineClear = pipe(addScore(800), addLines(4), checkLevelUp);

    const initialState: TestGameState = { score: 0, lines: 8, level: 1 };
    const nextState = processLineClear(initialState);

    expect(nextState).toEqual({
      score: 800,
      lines: 12,
      level: 2,
    });
    // ตรวจสอบว่า initialState ไม่ถูก mutate
    expect(initialState).toEqual({ score: 0, lines: 8, level: 1 });
  });

  test('ทำงานกับ String transformations ได้อย่างถูกต้อง', () => {
    const trim = (s: string) => s.trim();
    const toUpper = (s: string) => s.toUpperCase();
    const addExclamation = (s: string) => `${s}!`;

    const formatMessage = pipe(trim, toUpper, addExclamation);
    expect(formatMessage('  tetris pure fp  ')).toBe('TETRIS PURE FP!');
  });
});

describe('shuffle() - Fisher-Yates array shuffle', () => {
  test('คงจำนวน elements และสมาชิกเดิมครบถ้วน', () => {
    const items = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'] as const;
    const shuffled = shuffle(items);

    expect(shuffled.length).toBe(items.length);
    expect(new Set(shuffled)).toEqual(new Set(items));
  });

  test('เป็น pure function ไม่ mutate array ต้นฉบับ', () => {
    const original = [1, 2, 3, 4, 5];
    const originalCopy = [...original];
    const shuffled = shuffle(original);

    expect(original).toEqual(originalCopy);
    expect(shuffled).not.toBe(original);
  });
});
