// 02-Tests/game-state-loop/score.test.ts
import { describe, expect, test } from 'bun:test';
import { calculateScore, getScoreFromActionResult } from '../../01-Source-code/game-state-loop/score';
import type { ActionResult } from '../../01-Source-code/shared/types';

describe('Scoring System (score.ts)', () => {
  describe('calculateScore()', () => {
    test('คำนวณคะแนนตามจำนวนแถวที่เคลียร์ที่ Level 1 ถูกต้องตามสเกล', () => {
      // 1 แถว = 100 * 1 = 100
      expect(calculateScore(1, 1)).toBe(100);
      // 2 แถว = 100 * 2.5 = 250
      expect(calculateScore(2, 1)).toBe(250);
      // 3 แถว = 100 * 4.5 = 450
      expect(calculateScore(3, 1)).toBe(450);
      // 4 แถว (Tetris) = 100 * 8 = 800
      expect(calculateScore(4, 1)).toBe(800);
    });

    test('คูณตัวคูณตามระดับ Level ถูกต้อง', () => {
      // Level 2
      expect(calculateScore(1, 2)).toBe(200);
      expect(calculateScore(4, 2)).toBe(1600);

      // Level 5
      expect(calculateScore(2, 5)).toBe(1250);
      expect(calculateScore(4, 5)).toBe(4000);
    });

    test('กรณีเคลียร์ 0 แถว หรือจำนวนแถวนอกเหนือจาก 1-4 คืนค่า 0', () => {
      expect(calculateScore(0, 1)).toBe(0);
      expect(calculateScore(5, 1)).toBe(0);
      expect(calculateScore(-1, 1)).toBe(0);
    });

    test('จัดการค่า level ผิดปกติ (ติดลบ, 0, NaN, Infinity) โดยใช้ level ขั้นต่ำ 1', () => {
      expect(calculateScore(1, 0)).toBe(100);
      expect(calculateScore(1, -5)).toBe(100);
      expect(calculateScore(1, NaN)).toBe(100);
      expect(calculateScore(1, Infinity)).toBe(100);
    });

    test('ปัดเศษทศนิยมของ level ลงเป็นจำนวนเต็ม', () => {
      expect(calculateScore(1, 2.7)).toBe(200);
    });
  });

  describe('getScoreFromActionResult()', () => {
    test('คืนค่า 0 เมื่อไม่มีแถวถูกลบ (linesCleared เป็น array ว่าง)', () => {
      const actionResult: ActionResult = {
        success: true,
        linesCleared: [],
        gameOver: false,
      };
      expect(getScoreFromActionResult(actionResult, 1)).toBe(0);
    });

    test('คืนค่า 0 เมื่อ linesCleared ไม่มีค่า', () => {
      const actionResult = {
        success: true,
        gameOver: false,
      } as unknown as ActionResult;
      expect(getScoreFromActionResult(actionResult, 1)).toBe(0);
    });

    test('คำนวณคะแนนถูกต้องเมื่อมีแถวถูกลบ', () => {
      const actionResult: ActionResult = {
        success: true,
        linesCleared: [18, 19], // 2 แถว
        gameOver: false,
      };
      expect(getScoreFromActionResult(actionResult, 3)).toBe(750); // 100 * 2.5 * 3 = 750
    });
  });
});
