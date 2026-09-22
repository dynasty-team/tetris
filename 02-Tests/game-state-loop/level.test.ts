// 02-Tests/game-state-loop/level.test.ts
import { describe, expect, test } from 'bun:test';
import { calculateLevel, getSpeedForLevel } from '../../01-Source-code/game-state-loop/level';

describe('Level & Speed System (level.ts)', () => {
  describe('calculateLevel()', () => {
    test('เริ่มต้นที่ Level 1 เมื่อลบ 0 ถึง 9 แถว', () => {
      expect(calculateLevel(0)).toBe(1);
      expect(calculateLevel(5)).toBe(1);
      expect(calculateLevel(9)).toBe(1);
    });

    test('เลื่อนระดับทุกๆ 10 แถวที่ลบได้', () => {
      expect(calculateLevel(10)).toBe(2);
      expect(calculateLevel(19)).toBe(2);
      expect(calculateLevel(20)).toBe(3);
      expect(calculateLevel(99)).toBe(10);
      expect(calculateLevel(100)).toBe(11);
    });

    test('จัดการค่าติดลบได้อย่างปลอดภัยโดยเริ่มที่ Level 1', () => {
      expect(calculateLevel(-5)).toBe(1);
      expect(calculateLevel(-100)).toBe(1);
    });
  });

  describe('getSpeedForLevel()', () => {
    test('Level 1 มีความเร็วเริ่มต้นที่ 1000ms', () => {
      expect(getSpeedForLevel(1)).toBe(1000);
    });

    test('ลดความเร็วลง 100ms ต่อหนึ่ง Level', () => {
      expect(getSpeedForLevel(2)).toBe(900);
      expect(getSpeedForLevel(3)).toBe(800);
      expect(getSpeedForLevel(5)).toBe(600);
      expect(getSpeedForLevel(10)).toBe(100);
    });

    test('ไม่เร็วกว่า 100ms (lower bound clamp)', () => {
      expect(getSpeedForLevel(11)).toBe(100);
      expect(getSpeedForLevel(15)).toBe(100);
      expect(getSpeedForLevel(100)).toBe(100);
    });

    test('จัดการกรณี level น้อยกว่า 1 หรือติดลบ โดยถือเป็น Level 1 (1000ms)', () => {
      expect(getSpeedForLevel(0)).toBe(1000);
      expect(getSpeedForLevel(-2)).toBe(1000);
    });
  });
});
