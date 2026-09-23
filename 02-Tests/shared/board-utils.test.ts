// 02-Tests/shared/board-utils.test.ts
import { describe, expect, test } from 'bun:test';
import {
  createEmptyBoard,
  getCell,
  setCell,
  isInBounds,
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
        expect(getCell(board, x, y)).toBe(0);
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

  test('getCell() อ่านค่านอกขอบกระดานแล้วคืน 0 โดยไม่ crash', () => {
    const board = createEmptyBoard();

    expect(getCell(board, -1, 0)).toBe(0);
    expect(getCell(board, 10, 5)).toBe(0);
    expect(getCell(board, 2, -1)).toBe(0);
    expect(getCell(board, 2, 25)).toBe(0);
  });

  test('setCell() เป็น pure function คืน board ใหม่โดยไม่ mutate board เดิม', () => {
    const originalBoard = createEmptyBoard();
    const modifiedBoard = setCell(originalBoard, 3, 5, 'T');

    // ตรวจสอบว่า board ใหม่มีค่าเปลี่ยนไป
    expect(getCell(modifiedBoard, 3, 5)).toBe('T');

    // ตรวจสอบว่า originalBoard ยังคงเป็น 0 ทั้งหมด (Immutability)
    expect(getCell(originalBoard, 3, 5)).toBe(0);
    expect(originalBoard).not.toBe(modifiedBoard);
    expect(originalBoard[5]).not.toBe(modifiedBoard[5]);
  });
});
