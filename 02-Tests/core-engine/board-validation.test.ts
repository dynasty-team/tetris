// 02-Tests/core-engine/board-validation.test.ts
import { describe, expect, test } from 'bun:test';
import { TetrisEngine } from '../../01-Source-code/core-engine/TetrisEngine';
import { createEmptyBoard, setCell } from '../../01-Source-code/shared/board-utils';
import type { Board } from '../../01-Source-code/shared/types';

describe('TetrisEngine - Board Dimensions & Validation (Requirement: 10 x 20 พอดี)', () => {
  describe('Constructor (initialBoard validation)', () => {
    test('สร้าง engine สำเร็จเมื่อไม่ส่ง initialBoard (ได้ empty board 10x20 อัตโนมัติ)', () => {
      const engine = new TetrisEngine();
      const board = engine.getBoard();

      expect(board.length).toBe(20);
      for (const row of board) {
        expect(row.length).toBe(10);
      }
    });

    test('สร้าง engine สำเร็จเมื่อส่ง initialBoard ขนาด 20 แถว x 10 คอลัมน์ที่ถูกต้อง', () => {
      let customBoard = createEmptyBoard();
      customBoard = setCell(customBoard, 0, 19, 'I');
      customBoard = setCell(customBoard, 9, 19, 'O');

      const engine = new TetrisEngine(undefined, customBoard);
      const retrievedBoard = engine.getBoard();

      expect(retrievedBoard.length).toBe(20);
      expect(retrievedBoard[19]![0]).toBe('I');
      expect(retrievedBoard[19]![9]).toBe('O');
    });

    test('โยน Error เมื่อ initialBoard มีจำนวนแถวน้อยกว่า 20 (เช่น [] หรือ 19 แถว)', () => {
      // กรณีกระดานว่างเปล่า []
      expect(() => new TetrisEngine(undefined, [] as unknown as Board)).toThrow(
        /Invalid board height/i,
      );

      // กรณีกระดานมีเพียง 19 แถว
      const shortRowsBoard = Array.from({ length: 19 }, () => Array(10).fill(0)) as Board;
      expect(() => new TetrisEngine(undefined, shortRowsBoard)).toThrow(/Invalid board height/i);

      // กรณีกระดานมีเพียง 10 แถว
      const halfRowsBoard = Array.from({ length: 10 }, () => Array(10).fill(0)) as Board;
      expect(() => new TetrisEngine(undefined, halfRowsBoard)).toThrow(/Invalid board height/i);
    });

    test('โยน Error เมื่อ initialBoard มีจำนวนแถวมากกว่า 20 (เช่น 21 แถว หรือ 25 แถว)', () => {
      const longRowsBoard = Array.from({ length: 21 }, () => Array(10).fill(0)) as Board;
      expect(() => new TetrisEngine(undefined, longRowsBoard)).toThrow(/Invalid board height/i);

      const excessRowsBoard = Array.from({ length: 25 }, () => Array(10).fill(0)) as Board;
      expect(() => new TetrisEngine(undefined, excessRowsBoard)).toThrow(/Invalid board height/i);
    });

    test('โยน Error เมื่อ initialBoard มีบางแถวที่มีคอลัมน์น้อยกว่า 10 (เช่น 9 คอลัมน์)', () => {
      const invalidColBoard = createEmptyBoard();
      // แถวที่ 5 มีเพียง 9 คอลัมน์
      invalidColBoard[5] = Array(9).fill(0);

      expect(() => new TetrisEngine(undefined, invalidColBoard)).toThrow(/Invalid board width/i);
    });

    test('โยน Error เมื่อ initialBoard มีบางแถวที่มีคอลัมน์มากกว่า 10 (เช่น 11 คอลัมน์)', () => {
      const invalidColBoard = createEmptyBoard();
      // แถวที่ 10 มี 11 คอลัมน์
      invalidColBoard[10] = Array(11).fill(0);

      expect(() => new TetrisEngine(undefined, invalidColBoard)).toThrow(/Invalid board width/i);
    });

    test('โยน Error เมื่อ initialBoard เป็น null หรือไม่ใช่ 2D array', () => {
      expect(() => new TetrisEngine(undefined, null as unknown as Board)).toThrow(
        /Invalid board/i,
      );
      expect(() => new TetrisEngine(undefined, 'not-a-board' as unknown as Board)).toThrow(
        /Invalid board/i,
      );

      const rowNotArrayBoard = createEmptyBoard();
      (rowNotArrayBoard as any)[3] = 'not-an-array';
      expect(() => new TetrisEngine(undefined, rowNotArrayBoard)).toThrow(/Invalid board row/i);
    });
  });

  describe('setBoard() validation', () => {
    test('กำหนด board ใหม่สำเร็จเมื่อส่ง board ขนาด 20 แถว x 10 คอลัมน์ที่ถูกต้อง', () => {
      const engine = new TetrisEngine();
      let newBoard = createEmptyBoard();
      newBoard = setCell(newBoard, 4, 10, 'T');

      expect(() => engine.setBoard(newBoard)).not.toThrow();
      expect(engine.getBoard()[10]![4]).toBe('T');
    });

    test('โยน Error เมื่อ setBoard ด้วย board ที่มีจำนวนแถวน้อยกว่า 20', () => {
      const engine = new TetrisEngine();
      const originalBoard = engine.getBoard();

      const shortBoard = Array.from({ length: 19 }, () => Array(10).fill(0)) as Board;
      expect(() => engine.setBoard(shortBoard)).toThrow(/Invalid board height/i);

      // สถานะ board เดิมของ engine ต้องไม่ถูกกระทบกระเทือน
      expect(engine.getBoard()).toEqual(originalBoard);
    });

    test('โยน Error เมื่อ setBoard ด้วย board ที่มีจำนวนแถวมากกว่า 20', () => {
      const engine = new TetrisEngine();
      const originalBoard = engine.getBoard();

      const longBoard = Array.from({ length: 22 }, () => Array(10).fill(0)) as Board;
      expect(() => engine.setBoard(longBoard)).toThrow(/Invalid board height/i);

      expect(engine.getBoard()).toEqual(originalBoard);
    });

    test('โยน Error เมื่อ setBoard ด้วย board ที่มีคอลัมน์น้อยกว่า 10', () => {
      const engine = new TetrisEngine();
      const originalBoard = engine.getBoard();

      const shortColBoard = createEmptyBoard();
      shortColBoard[0] = Array(8).fill(0);

      expect(() => engine.setBoard(shortColBoard)).toThrow(/Invalid board width/i);
      expect(engine.getBoard()).toEqual(originalBoard);
    });

    test('โยน Error เมื่อ setBoard ด้วย board ที่มีคอลัมน์มากกว่า 10', () => {
      const engine = new TetrisEngine();
      const originalBoard = engine.getBoard();

      const longColBoard = createEmptyBoard();
      longColBoard[19] = Array(12).fill(0);

      expect(() => engine.setBoard(longColBoard)).toThrow(/Invalid board width/i);
      expect(engine.getBoard()).toEqual(originalBoard);
    });

    test('โยน Error เมื่อ setBoard ด้วย null, undefined หรือ structure ผิดปกติ', () => {
      const engine = new TetrisEngine();

      expect(() => engine.setBoard(null as unknown as Board)).toThrow(/Invalid board/i);
      expect(() => engine.setBoard(undefined as unknown as Board)).toThrow(/Invalid board/i);
      expect(() => engine.setBoard([] as unknown as Board)).toThrow(/Invalid board height/i);

      const rowNotArray = createEmptyBoard();
      (rowNotArray as any)[7] = 12345;
      expect(() => engine.setBoard(rowNotArray)).toThrow(/Invalid board row/i);
    });
  });
});
