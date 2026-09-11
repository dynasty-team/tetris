// 02-Tests/core-engine/line-clear.test.ts
import { describe, expect, test } from 'bun:test';
import type { Board, CellValue } from '../../01-Source-code/shared/types';
import { createEmptyBoard, setCell } from '../../01-Source-code/shared/board-utils';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../../01-Source-code/shared/constants';
import { checkAndClearLines } from '../../01-Source-code/core-engine/line-clear';

/** Helper สำหรับสร้างแถวที่เต็ม 10/10 ช่อง */
function createFullRow(pieceType: CellValue = 'I'): CellValue[] {
  return Array<CellValue>(BOARD_WIDTH).fill(pieceType);
}

/** Helper สำหรับสร้างแถวที่เกือบเต็ม (มีช่องว่าง 1 ช่อง ไม่เต็ม 10/10) */
function createIncompleteRow(emptyCol: number = 0, pieceType: CellValue = 'T'): CellValue[] {
  const row = Array<CellValue>(BOARD_WIDTH).fill(pieceType);
  row[emptyCol] = 0;
  return row;
}

describe('checkAndClearLines() - ระบบตรวจจับและลบแถวที่เต็ม', () => {
  describe('กรณีไม่มีการลบแถว (No Lines Cleared)', () => {
    test('กระดานว่างเปล่า (Empty Board) ไม่มีแถวใดถูกลบ', () => {
      const board = createEmptyBoard();
      const result = checkAndClearLines(board);

      expect(result.linesCleared).toBe(0);
      expect(result.clearedLines).toEqual([]);
      expect(result.newBoard.length).toBe(BOARD_HEIGHT);
      expect(result.newBoard).toEqual(board);
    });

    test('แถวมีบล็อกอยู่แต่ไม่เต็ม 10/10 (เช่น 9/10 ช่อง) จะไม่ถูกลบ', () => {
      let board = createEmptyBoard();
      // สร้างแถวล่างสุด row 19 ให้มีบล็อก 9 ช่อง ช่องที่ 5 ว่าง
      board[19] = createIncompleteRow(5, 'S');

      const result = checkAndClearLines(board);

      expect(result.linesCleared).toBe(0);
      expect(result.clearedLines).toEqual([]);
      expect(result.newBoard[19]?.[5]).toBe(0);
      expect(result.newBoard[19]?.[0]).toBe('S');
    });

    test('มีบล็อกกระจัดกระจายหลายแถวแต่ไม่มีแถวใดเต็ม 10/10', () => {
      let board = createEmptyBoard();
      board = setCell(board, 2, 18, 'J');
      board = setCell(board, 4, 18, 'L');
      board = setCell(board, 6, 19, 'Z');

      const result = checkAndClearLines(board);

      expect(result.linesCleared).toBe(0);
      expect(result.clearedLines).toEqual([]);
      expect(result.newBoard).toEqual(board);
    });
  });

  describe('กรณีลบ 1 แถว (Single Line Clear)', () => {
    test('แถวล่างสุดเต็ม 10/10 (row 19) ถูกลบ และแถวบนเลื่อนลงมาแทนที่', () => {
      const board = createEmptyBoard();
      // row 18 มีบล็อกเดี่ยวที่ col 3
      board[18] = createEmptyBoard()[18]!;
      board[18][3] = 'T';
      // row 19 เต็มทั้ง 10 ช่อง
      board[19] = createFullRow('I');

      const result = checkAndClearLines(board);

      expect(result.linesCleared).toBe(1);
      expect(result.clearedLines).toEqual([19]);
      expect(result.newBoard.length).toBe(BOARD_HEIGHT);
      // แถว 18 เดิม (ที่มี T ที่ col 3) ต้องเลื่อนลงมาอยู่ที่ row 19
      expect(result.newBoard[19]?.[3]).toBe('T');
      // แถวด้านบนสุด (row 0) ต้องเป็นแถวว่าง
      expect(result.newBoard[0]).toEqual(Array(BOARD_WIDTH).fill(0));
    });

    test('แถวกลางกระดานเต็ม (row 10) ถูกลบ และเฉพาะแถวด้านบนเท่านั้นที่เลื่อนลงมา', () => {
      const board = createEmptyBoard();
      // row 9 มีบล็อกที่ col 1
      board[9]![1] = 'J';
      // row 10 เต็ม
      board[10] = createFullRow('O');
      // row 15 มีบล็อกที่ col 8 (อยู่ใต้ row 10 ต้องไม่ขยับ)
      board[15]![8] = 'Z';

      const result = checkAndClearLines(board);

      expect(result.linesCleared).toBe(1);
      expect(result.clearedLines).toEqual([10]);
      // row 9 ต้องเลื่อนลงมาอยู่ที่ row 10
      expect(result.newBoard[10]?.[1]).toBe('J');
      // row 15 ที่อยู่ใต้แถวที่ถูกลบต้องคงอยู่ที่ row 15 เหมือนเดิม
      expect(result.newBoard[15]?.[8]).toBe('Z');
    });

    test('แถวบนสุดเต็ม (row 0) ถูกลบอย่างถูกต้อง', () => {
      const board = createEmptyBoard();
      board[0] = createFullRow('L');

      const result = checkAndClearLines(board);

      expect(result.linesCleared).toBe(1);
      expect(result.clearedLines).toEqual([0]);
      expect(result.newBoard.length).toBe(BOARD_HEIGHT);
      expect(result.newBoard[0]).toEqual(Array(BOARD_WIDTH).fill(0));
    });
  });

  describe('กรณีลบ 2 แถว และ 3 แถว (Double & Triple Line Clear)', () => {
    test('ลบ 2 แถวล่างสุด (Double: rows 18, 19)', () => {
      const board = createEmptyBoard();
      board[17]![0] = 'I';
      board[18] = createFullRow('S');
      board[19] = createFullRow('Z');

      const result = checkAndClearLines(board);

      expect(result.linesCleared).toBe(2);
      expect(result.clearedLines).toEqual([18, 19]);
      // row 17 เลื่อนลงมา 2 แถวไปอยู่ที่ row 19
      expect(result.newBoard[19]?.[0]).toBe('I');
      // แถว 0 และ 1 ด้านบนเป็นแถวว่าง
      expect(result.newBoard[0]).toEqual(Array(BOARD_WIDTH).fill(0));
      expect(result.newBoard[1]).toEqual(Array(BOARD_WIDTH).fill(0));
    });

    test('ลบ 3 แถวต่อเนื่องกัน (Triple: rows 17, 18, 19)', () => {
      const board = createEmptyBoard();
      board[16]![5] = 'O';
      board[17] = createFullRow('T');
      board[18] = createFullRow('J');
      board[19] = createFullRow('L');

      const result = checkAndClearLines(board);

      expect(result.linesCleared).toBe(3);
      expect(result.clearedLines).toEqual([17, 18, 19]);
      // row 16 เลื่อนลงมา 3 แถวไปอยู่ที่ row 19
      expect(result.newBoard[19]?.[5]).toBe('O');
      // แถว 0, 1, 2 เป็นแถวว่าง
      expect(result.newBoard[0]).toEqual(Array(BOARD_WIDTH).fill(0));
      expect(result.newBoard[1]).toEqual(Array(BOARD_WIDTH).fill(0));
      expect(result.newBoard[2]).toEqual(Array(BOARD_WIDTH).fill(0));
    });
  });

  describe('กรณีลบ 4 แถวพร้อมกัน (Tetris Line Clear)', () => {
    test('ลบ 4 แถวล่างสุดพร้อมกัน (rows 16, 17, 18, 19)', () => {
      const board = createEmptyBoard();
      board[15]![2] = 'S';
      board[15]![7] = 'Z';
      board[16] = createFullRow('I');
      board[17] = createFullRow('I');
      board[18] = createFullRow('I');
      board[19] = createFullRow('I');

      const result = checkAndClearLines(board);

      expect(result.linesCleared).toBe(4);
      expect(result.clearedLines).toEqual([16, 17, 18, 19]);
      expect(result.newBoard.length).toBe(BOARD_HEIGHT);
      // row 15 เลื่อนลงมา 4 แถวไปอยู่ที่ row 19
      expect(result.newBoard[19]?.[2]).toBe('S');
      expect(result.newBoard[19]?.[7]).toBe('Z');
      // แถวบน 4 แถวแรก (rows 0, 1, 2, 3) ต้องเป็นแถวว่างทั้งหมด
      for (let y = 0; y < 4; y++) {
        expect(result.newBoard[y]).toEqual(Array(BOARD_WIDTH).fill(0));
      }
    });

    test('ลบ 4 แถวที่ประกอบด้วยชิ้นส่วนหลากหลายประเภทผสมกันในแต่ละแถว', () => {
      const board = createEmptyBoard();
      // สร้างแถวผสมชนิดต่างๆ ให้เต็ม 10/10 ช่อง
      const mixedRow: CellValue[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L', 'I', 'O', 'T'];
      board[16] = [...mixedRow];
      board[17] = [...mixedRow];
      board[18] = [...mixedRow];
      board[19] = [...mixedRow];

      const result = checkAndClearLines(board);

      expect(result.linesCleared).toBe(4);
      expect(result.clearedLines).toEqual([16, 17, 18, 19]);
      expect(result.newBoard[19]).toEqual(Array(BOARD_WIDTH).fill(0));
    });
  });

  describe('กรณีลบแถวที่ไม่ต่อเนื่องกัน (Non-contiguous Line Clears)', () => {
    test('ลบแถวที่ 16 และแถวที่ 19 โดยมีแถวไม่เต็มคั่นกลาง', () => {
      const board = createEmptyBoard();
      board[15]![1] = 'T';
      board[16] = createFullRow('I'); // ลบ
      board[17] = createIncompleteRow(2, 'O'); // ไม่ลบ (มีช่องว่างที่ col 2)
      board[18] = createIncompleteRow(4, 'S'); // ไม่ลบ (มีช่องว่างที่ col 4)
      board[19] = createFullRow('Z'); // ลบ

      const result = checkAndClearLines(board);

      expect(result.linesCleared).toBe(2);
      expect(result.clearedLines).toEqual([16, 19]);
      // แถว 18 เดิม เลื่อนลง 1 แถวไปอยู่ที่ 19
      expect(result.newBoard[19]?.[0]).toBe('S');
      expect(result.newBoard[19]?.[4]).toBe(0);
      // แถว 17 เดิม เลื่อนลง 1 แถวไปอยู่ที่ 18
      expect(result.newBoard[18]?.[0]).toBe('O');
      expect(result.newBoard[18]?.[2]).toBe(0);
      // แถว 15 เดิม เลื่อนลง 2 แถวไปอยู่ที่ 17
      expect(result.newBoard[17]?.[1]).toBe('T');
    });
  });

  describe('Pure Function & Immutability Guarantee', () => {
    test('ฟังก์ชันไม่เปลี่ยนแปลง (mutate) ข้อมูลใน Board เดิม', () => {
      const board = createEmptyBoard();
      board[19] = createFullRow('I');
      // เก็บ deep copy เพื่อเปรียบเทียบ
      const originalBoardCopy = board.map((row) => [...row]);

      const result = checkAndClearLines(board);

      // board ต้นฉบับต้องคงค่าเดิมทุกประการ
      expect(board).toEqual(originalBoardCopy);
      expect(board[19]?.[0]).toBe('I');

      // newBoard ต้องเป็นคนละ reference กับ board เดิม
      expect(result.newBoard).not.toBe(board);
      expect(result.newBoard[19]).not.toBe(board[19]);
    });
  });
});
