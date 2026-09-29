// 02-Tests/shared/board-utils.test.ts
import { describe, expect, test } from 'bun:test';
import {
  createEmptyBoard,
  setCell,
  isInBounds,
  isValidBoard,
  validateBoard,
} from '../../01-Source-code/shared/board-utils';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../../01-Source-code/shared/constants';

describe('Board size & board-utils', () => {
  test('ขนาด board ถูกต้องตามมาตรฐาน 20 แถว x 10 คอลัมน์ (BOARD_HEIGHT x BOARD_WIDTH)', () => {
    const board = createEmptyBoard();

    // ตรวจสอบค่าคงที่มาตรฐาน
    expect(BOARD_HEIGHT).toBe(20);
    expect(BOARD_WIDTH).toBe(10);

    // ตรวจสอบจำนวนแถวทั้งหมด (y = 0 ถึง 19)
    expect(board.length).toBe(BOARD_HEIGHT);

    // ตรวจสอบจำนวนคอลัมน์ในทุกๆ แถว (x = 0 ถึง 9)
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      const row = board[y]!;
      expect(row.length).toBe(BOARD_WIDTH);
    }
  });

  test('ทุก cell บน empty board เริ่มต้นด้วยค่า 0 (ว่าง)', () => {
    const board = createEmptyBoard();

    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        expect(board[y]![x]).toBe(0);
      }
    }
  });

  test('isInBounds() ตรวจสอบขอบเขตของ board ขนาด 10x20 ได้ถูกต้อง', () => {
    // ภายในขอบเขต (Valid bounds)
    expect(isInBounds(0, 0)).toBe(true); // มุมบนซ้าย
    expect(isInBounds(9, 0)).toBe(true); // มุมบนขวา
    expect(isInBounds(0, 19)).toBe(true); // มุมล่างซ้าย
    expect(isInBounds(9, 19)).toBe(true); // มุมล่างขวา
    expect(isInBounds(4, 10)).toBe(true); // กลางกระดาน

    // ภายนอกขอบเขต (Out of bounds)
    expect(isInBounds(-1, 0)).toBe(false); // ซ้ายเกิน
    expect(isInBounds(10, 0)).toBe(false); // ขวาเกิน
    expect(isInBounds(0, -1)).toBe(false); // บนเกิน
    expect(isInBounds(0, 20)).toBe(false); // ล่างเกิน
    expect(isInBounds(-1, -1)).toBe(false);
    expect(isInBounds(10, 20)).toBe(false);
  });

  test('setCell() เป็น pure function คืน board ใหม่โดยไม่ mutate board เดิม', () => {
    const originalBoard = createEmptyBoard();
    const modifiedBoard = setCell(originalBoard, 3, 5, 'T');

    // ตรวจสอบว่า board ใหม่มีค่าเปลี่ยนไป
    expect(modifiedBoard[5]![3]).toBe('T');

    // ตรวจสอบว่า originalBoard ยังคงเป็น 0 ทั้งหมด (Immutability)
    expect(originalBoard[5]![3]).toBe(0);
    expect(originalBoard).not.toBe(modifiedBoard);
    expect(originalBoard[5]).not.toBe(modifiedBoard[5]);
  });

  test('isValidBoard() ตรวจสอบขนาด 20 แถว x 10 คอลัมน์ได้ถูกต้อง', () => {
    const validBoard = createEmptyBoard();
    expect(isValidBoard(validBoard)).toBe(true);

    // ขนาดแถวไม่ถูกต้อง (< 20 หรือ > 20)
    expect(isValidBoard([])).toBe(false);
    expect(isValidBoard(Array.from({ length: 19 }, () => Array(10).fill(0)))).toBe(false);
    expect(isValidBoard(Array.from({ length: 21 }, () => Array(10).fill(0)))).toBe(false);

    // ขนาดคอลัมน์ไม่ถูกต้อง (< 10 หรือ > 10)
    const shortColBoard = createEmptyBoard();
    shortColBoard[5] = Array(9).fill(0);
    expect(isValidBoard(shortColBoard)).toBe(false);

    const longColBoard = createEmptyBoard();
    longColBoard[10] = Array(11).fill(0);
    expect(isValidBoard(longColBoard)).toBe(false);

    // ค่าที่ไม่ใช่ array
    expect(isValidBoard(null)).toBe(false);
    expect(isValidBoard(undefined)).toBe(false);
    expect(isValidBoard({})).toBe(false);
    expect(isValidBoard(123)).toBe(false);

    // แถวข้างในไม่ใช่ array
    const malformedRowBoard = createEmptyBoard();
    (malformedRowBoard as any)[0] = null;
    expect(isValidBoard(malformedRowBoard)).toBe(false);
  });

  test('validateBoard() throw Error เมื่อ board ขนาดผิด หรือ format ผิด', () => {
    const validBoard = createEmptyBoard();
    expect(() => validateBoard(validBoard)).not.toThrow();

    // ไม่ใช่ array
    expect(() => validateBoard(null)).toThrow('Invalid board: board must be an array');
    expect(() => validateBoard('not an array')).toThrow('Invalid board: board must be an array');

    // จำนวนแถวไม่ตรง 20
    expect(() => validateBoard([])).toThrow('Invalid board height: board must have exactly 20 rows, but got 0');
    expect(() => validateBoard(Array.from({ length: 19 }, () => Array(10).fill(0)))).toThrow(
      'Invalid board height: board must have exactly 20 rows, but got 19',
    );
    expect(() => validateBoard(Array.from({ length: 25 }, () => Array(10).fill(0)))).toThrow(
      'Invalid board height: board must have exactly 20 rows, but got 25',
    );

    // จำนวนคอลัมน์ไม่ตรง 10
    const shortColBoard = createEmptyBoard();
    shortColBoard[3] = Array(8).fill(0);
    expect(() => validateBoard(shortColBoard)).toThrow(
      'Invalid board width at row 3: each row must have exactly 10 columns, but got 8',
    );

    const longColBoard = createEmptyBoard();
    longColBoard[7] = Array(12).fill(0);
    expect(() => validateBoard(longColBoard)).toThrow(
      'Invalid board width at row 7: each row must have exactly 10 columns, but got 12',
    );

    // แถวไม่ใช่ array
    const nonArrayRowBoard = createEmptyBoard();
    (nonArrayRowBoard as any)[2] = 'not-row';
    expect(() => validateBoard(nonArrayRowBoard)).toThrow(
      'Invalid board row at index 2: row must be an array',
    );
  });
});
