// 02-Tests/core-engine/collision.test.ts
import { describe, expect, test } from 'bun:test';
import type { Board, ActivePiece, TetrominoType } from '../../01-Source-code/shared/types';
import { createEmptyBoard, setCell } from '../../01-Source-code/shared/board-utils';
import { checkCollision } from '../../01-Source-code/core-engine/collision';
import { getShape, rotatePiece } from '../../01-Source-code/core-engine/tetromino-shapes';

/** Helper สำหรับสร้าง ActivePiece สำหรับการทดสอบ */
function createTestPiece(
  type: TetrominoType,
  x: number,
  y: number,
  rotation: 0 | 1 | 2 | 3 = 0,
): ActivePiece {
  return {
    type,
    position: { x, y },
    rotation,
    shape: getShape(type, rotation),
  };
}

describe('checkCollision() - ตรวจจับการชนสำหรับ Core Engine', () => {
  describe('กรณีไม่ชน (Normal Placement - คืนค่า false)', () => {
    test('วาง piece ที่ตำแหน่งเริ่มต้นกลางกระดานบน empty board แล้วไม่ชน', () => {
      const board = createEmptyBoard();
      const piece = createTestPiece('T', 3, 0);

      expect(checkCollision(board, piece)).toBe(false);
    });

    test('ครบทั้ง 7 ชิ้นส่วน (I, O, T, S, Z, J, L) สามารถวางบน empty board ได้อย่างถูกต้องโดยไม่ชน', () => {
      const board = createEmptyBoard();
      const pieces: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

      for (const type of pieces) {
        const piece = createTestPiece(type, 3, 5);
        expect(checkCollision(board, piece)).toBe(false);
      }
    });

    test('วางชิดขอบซ้ายพอดี (block อยู่ที่ x=0) โดยไม่หลุดขอบ ไม่ชน', () => {
      const board = createEmptyBoard();
      // O piece: shape row 0: [0, 1, 1, 0] -> ถ้า position.x = -1, บล็อกจะอยู่ที่ x = -1+1 = 0 และ x = -1+2 = 1
      const piece = createTestPiece('O', -1, 5);
      expect(checkCollision(board, piece)).toBe(false);
    });

    test('วางชิดขอบขวาพอดี (block อยู่ที่ x=9) โดยไม่หลุดขอบ ไม่ชน', () => {
      const board = createEmptyBoard();
      // O piece: shape row 0: [0, 1, 1, 0] -> ถ้า position.x = 7, บล็อกจะอยู่ที่ x = 7+1 = 8 และ x = 7+2 = 9
      const piece = createTestPiece('O', 7, 5);
      expect(checkCollision(board, piece)).toBe(false);
    });

    test('วางชิดพื้นพอดี (block อยู่ที่ y=19) โดยไม่หลุดขอบ ไม่ชน', () => {
      const board = createEmptyBoard();
      // I piece spawn (rot 0): แนวนอนอยู่ที่ row 1 -> position.y = 18 ทำให้บล็อกอยู่ที่ y = 18+1 = 19
      const piece = createTestPiece('I', 3, 18, 0);
      expect(checkCollision(board, piece)).toBe(false);
    });

    test('ชิ้นส่วนอยู่ใน Buffer Zone เหนือกระดาน (y < 0) แต่ตำแหน่ง x อยู่ในขอบเขต ไม่ชน', () => {
      const board = createEmptyBoard();
      // T piece spawn มีบล็อกที่ row 0 และ 1 -> position.y = -1 แปลว่า row 0 อยู่ที่ y=-1, row 1 อยู่ที่ y=0
      const piece = createTestPiece('T', 3, -1, 0);
      expect(checkCollision(board, piece)).toBe(false);
    });
  });

  describe('ชนขอบซ้าย (Left Wall Collision: x < 0 - คืนค่า true)', () => {
    test('ชิ้นส่วนขยับเลยขอบซ้ายออกไป (x < 0) คืนค่า true', () => {
      const board = createEmptyBoard();
      // O piece บล็อกอยู่ที่ col 1, 2 -> ถ้า position.x = -2 บล็อกแรกจะอยู่ที่ x = -2+1 = -1
      const piece = createTestPiece('O', -2, 5);
      expect(checkCollision(board, piece)).toBe(true);
    });

    test('I piece แนวนอน (rot 0, บล็อกอยู่ที่ col 0, 1, 2, 3) ขยับไปที่ position.x = -1 ชนขอบซ้าย', () => {
      const board = createEmptyBoard();
      const piece = createTestPiece('I', -1, 5, 0);
      expect(checkCollision(board, piece)).toBe(true);
    });

    test('J piece ที่หมุนแล้วยื่นไปทางซ้ายหลุดขอบกระดาน คืนค่า true', () => {
      const board = createEmptyBoard();
      // J piece rot 0: row 0 col 0 = 1 -> position.x = -1 บล็อกแรกอยู่ที่ x = -1
      const piece = createTestPiece('J', -1, 5, 0);
      expect(checkCollision(board, piece)).toBe(true);
    });
  });

  describe('ชนขอบขวา (Right Wall Collision: x >= 10 - คืนค่า true)', () => {
    test('ชิ้นส่วนขยับเลยขอบขวาออกไป (x >= 10) คืนค่า true', () => {
      const board = createEmptyBoard();
      // O piece บล็อกอยู่ที่ col 1, 2 -> ถ้า position.x = 8 บล็อกขวาจะอยู่ที่ x = 8+2 = 10
      const piece = createTestPiece('O', 8, 5);
      expect(checkCollision(board, piece)).toBe(true);
    });

    test('I piece แนวนอน (rot 0, บล็อก col 0, 1, 2, 3) position.x = 7 บล็อกขวาสุดอยู่ที่ x = 7+3 = 10 ชนขอบขวา', () => {
      const board = createEmptyBoard();
      const piece = createTestPiece('I', 7, 5, 0);
      expect(checkCollision(board, piece)).toBe(true);
    });

    test('T piece (rot 0, บล็อก col 0, 1, 2) position.x = 8 บล็อกขวาสุดอยู่ที่ x = 8+2 = 10 ชนขอบขวา', () => {
      const board = createEmptyBoard();
      const piece = createTestPiece('T', 8, 5, 0);
      expect(checkCollision(board, piece)).toBe(true);
    });
  });

  describe('ชนพื้นกระดาน (Floor Collision: y >= 20 - คืนค่า true)', () => {
    test('ชิ้นส่วนขยับลงจนบล็อกหลุดขอบล่าง (y >= 20) คืนค่า true', () => {
      const board = createEmptyBoard();
      // I piece spawn (row 1 มีบล็อก) -> position.y = 19 บล็อกจะอยู่ที่ y = 19+1 = 20 (เกิน 19)
      const piece = createTestPiece('I', 3, 19, 0);
      expect(checkCollision(board, piece)).toBe(true);
    });

    test('O piece (row 0, 1 มีบล็อก) position.y = 19 บล็อกจะอยู่ที่ y = 19+1 = 20 ชนพื้น', () => {
      const board = createEmptyBoard();
      const piece = createTestPiece('O', 3, 19);
      expect(checkCollision(board, piece)).toBe(true);
    });

    test('T piece ชี้ลง (rot 2, มีบล็อกที่ row 2 col 1) position.y = 18 บล็อกจะอยู่ที่ y = 18+2 = 20 ชนพื้น', () => {
      const board = createEmptyBoard();
      const piece = createTestPiece('T', 3, 18, 2);
      expect(checkCollision(board, piece)).toBe(true);
    });
  });

  describe('ชนบล็อกที่วางอยู่แล้วบนกระดาน (Occupied Cell Collision - คืนค่า true)', () => {
    test('ชนบล็อกเดิมเมื่อ active piece ขยับไปทับ cell ที่มีค่าไม่ใช่ 0', () => {
      let board = createEmptyBoard();
      // จำลองว่ามีบล็อกเดิมวางอยู่ที่ตำแหน่ง (x=4, y=10)
      board = setCell(board, 4, 10, 'I');

      // T piece วางที่ (x=3, y=9):
      // T shape rot 0 มีบล็อกที่ row 1, col 1 -> ตำแหน่งบนกระดานคือ x=3+1=4, y=9+1=10
      const piece = createTestPiece('T', 3, 9, 0);

      expect(checkCollision(board, piece)).toBe(true);
    });

    test('ไม่ชนเมื่อ active piece อยู่ติดกับบล็อกเดิมแต่ไม่ทับซ้อนกัน', () => {
      let board = createEmptyBoard();
      // วางบล็อกเดิมไว้ที่ (x=6, y=10) ติดกับปีกขวาของ T (อยู่ที่ x=5, y=10)
      // และที่ (x=2, y=10) ติดกับปีกซ้ายของ T (อยู่ที่ x=3, y=10)
      board = setCell(board, 6, 10, 'Z');
      board = setCell(board, 2, 10, 'S');

      // T piece วางที่ (x=3, y=9):
      // บล็อกของ T ประกอบด้วย (4, 9), (3, 10), (4, 10), (5, 10)
      // ซึ่งไม่ทับซ้อนกับ (6, 10) หรือ (2, 10)
      const piece = createTestPiece('T', 3, 9, 0);

      expect(checkCollision(board, piece)).toBe(false);
    });

    test('ชนบล็อกเดิมประเภทต่างๆ (J, L, S, Z, T, O, I)', () => {
      const blockTypes: TetrominoType[] = ['J', 'L', 'S', 'Z', 'T', 'O', 'I'];
      for (const blockType of blockTypes) {
        let board = createEmptyBoard();
        board = setCell(board, 5, 15, blockType);

        // O piece ที่ position (x=4, y=14) มีบล็อกที่ row 1 col 1 -> (x=4+1=5, y=14+1=15)
        const piece = createTestPiece('O', 4, 14);
        expect(checkCollision(board, piece)).toBe(true);
      }
    });
  });

  describe('Buffer Zone และ Edge Cases', () => {
    test('ชิ้นส่วนอยู่ใน Buffer Zone เหนือกระดาน (y < 0) แต่ออกนอกขอบซ้าย/ขวา ถือว่าชน', () => {
      const board = createEmptyBoard();
      // O piece ที่ position.x = -2, y = -1 -> ออกนอกขอบซ้าย
      const piece = createTestPiece('O', -2, -1);
      expect(checkCollision(board, piece)).toBe(true);
    });

    test('ชิ้นส่วนทั้งชิ้นลอยอยู่เหนือกระดาน (y = -3) แต่ x อยู่ในขอบเขต ไม่ชน', () => {
      const board = createEmptyBoard();
      const piece = createTestPiece('I', 3, -3, 0);
      expect(checkCollision(board, piece)).toBe(false);
    });
  });

  describe('การประยุกต์ใช้กับ Wall-Kick Simulation', () => {
    test('จำลองการหมุนติดกำแพงขวา แล้ว wall-kick offset สำเร็จ', () => {
      const board = createEmptyBoard();

      // I piece แนวตั้ง (rot 1: col 2 มีบล็อกตั้งแต่ row 0..3) วางที่ position.x = 7 -> บล็อกอยู่ที่ x=9 ชิดขอบขวาพอดี
      const verticalI = createTestPiece('I', 7, 5, 1);
      expect(checkCollision(board, verticalI)).toBe(false);

      // เมื่อหมุนเป็นแนวนอน (rot 2: row 2 มีบล็อกที่ col 0..3)
      // basic rotation (offset (0, 0)): position.x = 7 -> บล็อกขวาสุดคือ x=7+3 = 10 (ชนขอบขวา!)
      const rotatedI = rotatePiece(verticalI);
      expect(checkCollision(board, rotatedI)).toBe(true);

      // จำลอง Wall-Kick Test 1: offset dx = -1 -> position.x = 6, บล็อกขวาสุดคือ 6+3 = 9 (ไม่ชน วางได้!)
      const kickedPiece: ActivePiece = {
        ...rotatedI,
        position: { x: rotatedI.position.x - 1, y: rotatedI.position.y },
      };
      expect(checkCollision(board, kickedPiece)).toBe(false);
    });
  });

  describe('Pure Function Guarantee', () => {
    test('checkCollision() ไม่เปลี่ยนแปลง (mutate) ข้อมูลใน board หรือ piece', () => {
      const originalBoard = createEmptyBoard();
      const boardCopy = originalBoard.map((row) => [...row]);

      const piece = createTestPiece('T', 3, 5, 0);
      const pieceCopy = JSON.parse(JSON.stringify(piece));

      checkCollision(originalBoard, piece);

      expect(originalBoard).toEqual(boardCopy);
      expect(piece).toEqual(pieceCopy);
    });
  });
});
