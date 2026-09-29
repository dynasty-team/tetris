// 02-Tests/core-engine/top-boundary-rotation.test.ts
//
// การทดสอบความถูกต้องของการหมุนที่ขอบบนกระดาน (Top Boundary / Ceiling Collision)
// ตามข้อกำหนด:
// Requirement: Board: "Piece ต้องไม่สามารถเคลื่อนออกนอก board ได้"
//
// เกณฑ์ที่ต้องผ่าน:
// 1. ไม่มี cell ของ piece ที่ lock แล้วหายไป (จำนวน cell บน board เพิ่มครบ 4 เสมอ)
// 2. กำหนดพฤติกรรมชัดเจนเมื่อ piece ล็อกโดยมี cell เหนือ board (Lock-Out Game Over หรือไม่อนุญาตการ kick นั้น)
// 3. มี test ครอบคลุมการหมุนที่ขอบบนสำหรับ Tetromino ทุกชนิด

import { describe, expect, test } from 'bun:test';
import type { Board, ActivePiece, TetrominoType } from '../../01-Source-code/shared/types';
import { createEmptyBoard, setCell } from '../../01-Source-code/shared/board-utils';
import { checkCollision } from '../../01-Source-code/core-engine/collision';
import { getShape } from '../../01-Source-code/core-engine/tetromino-shapes';
import {
  rotate,
  lockPieceToBoard,
  performLock,
  hasCellsAboveBoard,
  type MovementState,
} from '../../01-Source-code/core-engine/movement';
import { lockActivePieceToBoardStep, applyLock } from '../../01-Source-code/core-engine/lock-pipeline';
import { TetrisEngine, DEFAULT_SPAWN_POSITION } from '../../01-Source-code/core-engine/TetrisEngine';

/** Helper สำหรับนับจำนวนบล็อก (occupied cells) ทั้งหมดบนกระดาน */
function countOccupiedCells(board: Board): number {
  let count = 0;
  for (let r = 0; r < board.length; r++) {
    const row = board[r];
    if (!row) continue;
    for (let c = 0; c < row.length; c++) {
      if (row[c] !== 0) {
        count++;
      }
    }
  }
  return count;
}

/** Helper สำหรับสร้าง ActivePiece */
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

describe('Top Boundary Rotation & Lock Integrity (ขอบบนและจำนวนบล็อกหลังล็อก)', () => {
  describe('เกณฑ์ที่ 1: ไม่มี cell ของ piece ที่ lock แล้วหายไป (จำนวน cell เพิ่มครบ 4 เสมอ)', () => {
    test('ทุกชนิดชิ้นส่วน (I, O, T, S, Z, J, L) เมื่อล็อกหลังหมุนที่ขอบบน จำนวนบล็อกบน board เพิ่มขึ้น 4 ช่องเสมอ', () => {
      const pieceTypes: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

      for (const type of pieceTypes) {
        const engine = new TetrisEngine();
        engine.setActivePiece(createTestPiece(type, 3, 0, 0));

        const cellsBefore = countOccupiedCells(engine.getBoard());
        expect(cellsBefore).toBe(0);

        // หมุนที่ขอบบน
        const rotResult = engine.rotate();
        // หากหมุนได้ ตำแหน่งต้องยังคงอยู่ในขอบเขต board ทั้งหมด
        if (rotResult.success) {
          const piece = engine.getActivePiece()!;
          for (let r = 0; r < piece.shape.length; r++) {
            for (let c = 0; c < piece.shape[r]!.length; c++) {
              if (piece.shape[r]![c]) {
                const cellY = piece.position.y + r;
                const cellX = piece.position.x + c;
                expect(cellY).toBeGreaterThanOrEqual(0);
                expect(cellY).toBeLessThan(20);
                expect(cellX).toBeGreaterThanOrEqual(0);
                expect(cellX).toBeLessThan(10);
              }
            }
          }
        }

        // ล็อกชิ้นส่วนลงกระดาน
        const lockResult = engine.hardDrop();
        expect(lockResult.success).toBe(true);

        const cellsAfter = countOccupiedCells(engine.getBoard());
        // ต้องเพิ่มขึ้นครบ 4 บล็อกเสมอ ไม่มีบล็อกหายไป
        expect(cellsAfter - cellsBefore).toBe(4);
      }
    });

    test('lockPieceToBoard() วางบล็อกทั้ง 4 ช่องลงบน board ครบถ้วนเมื่อ activePiece อยู่ที่ row 0', () => {
      const board = createEmptyBoard();
      const piece = createTestPiece('T', 3, 0, 0);

      const beforeCount = countOccupiedCells(board);
      lockPieceToBoard(board, piece);
      const afterCount = countOccupiedCells(board);

      expect(afterCount - beforeCount).toBe(4);
      // T spawn (rot 0): (4, 0), (3, 1), (4, 1), (5, 1)
      expect(board[0]![4]).toBe('T');
      expect(board[1]![3]).toBe('T');
      expect(board[1]![4]).toBe('T');
      expect(board[1]![5]).toBe('T');
    });

    test('ล็อก T-piece หลังหมุนเป็น rotation 1 ที่ขอบบน (y=0) ได้ครบ 4 ช่อง', () => {
      const board = createEmptyBoard();
      // T rot 1 ที่ position (3, 0): (4, 0), (4, 1), (5, 1), (4, 2)
      const piece = createTestPiece('T', 3, 0, 1);

      lockPieceToBoard(board, piece);
      expect(countOccupiedCells(board)).toBe(4);
      expect(board[0]![4]).toBe('T');
      expect(board[1]![4]).toBe('T');
      expect(board[1]![5]).toBe('T');
      expect(board[2]![4]).toBe('T');
    });
  });

  describe('เกณฑ์ที่ 2: กำหนดพฤติกรรมชัดเจนเมื่อ piece ล็อกโดยมี cell เหนือ board และไม่อนุญาต kick ออกนอกกระดาน', () => {
    test('ไม่อนุญาต Wall Kick ที่จะดัน piece ขึ้นเหนือแถว 0 (y < 0)', () => {
      // บล็อกช่องที่ offset [0,0] และ [-1,0] จะใช้
      // เมื่อ T อยู่ที่ (3, 0) หมุน 0 -> 1:
      // Offset 1 [0,0] วาง (4,0) -> ติดบล็อก
      // Offset 2 [-1,0] วาง (3,0) -> ติดบล็อก
      // Offset 3 [-1,-1] จะพา piece ไปที่ position.y = -1 มี cell ที่ y = -1
      // ระบบต้อง REJECT offset 3 นี้ ไม่ยอมให้ลอยออกนอกกระดาน
      let board = createEmptyBoard();
      board = setCell(board, 4, 0, 'Z');
      board = setCell(board, 3, 0, 'Z');

      const engine = new TetrisEngine();
      engine.setBoard(board);
      engine.setActivePiece(createTestPiece('T', 3, 0, 0));

      const result = engine.rotate();

      // การหมุนต้องไม่วาง piece ที่ y < 0 เด็ดขาด
      const activePiece = engine.getActivePiece()!;
      expect(activePiece.position.y).toBeGreaterThanOrEqual(0);

      // ยืนยันว่าทุก cell ของ piece อยู่ภายในแถว 0..19
      for (let r = 0; r < activePiece.shape.length; r++) {
        for (let c = 0; c < activePiece.shape[r]!.length; c++) {
          if (activePiece.shape[r]![c]) {
            const y = activePiece.position.y + r;
            expect(y).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });

    test('hasCellsAboveBoard() ตรวจจับ cell ที่อยู่เหนือกระดาน (boardY < 0) ได้อย่างถูกต้อง', () => {
      // Piece ที่มี position.y = -1 และมี cell ที่ row 0 -> boardY = -1 < 0
      const pieceAbove = createTestPiece('T', 3, -1, 0);
      expect(hasCellsAboveBoard(pieceAbove)).toBe(true);

      // Piece ที่วางที่ y = 0 ทั้งหมดอยู่ในกระดาน -> boardY >= 0
      const pieceInBounds = createTestPiece('T', 3, 0, 0);
      expect(hasCellsAboveBoard(pieceInBounds)).toBe(false);

      // I piece แนวนอน (rot 0 มีบล็อกที่ row 1) ถ้าวางที่ position.y = -1
      // row 1 จะอยู่ที่ y = -1 + 1 = 0 (ยังอยู่ในกระดาน)
      const pieceHorizontalI = createTestPiece('I', 3, -1, 0);
      expect(hasCellsAboveBoard(pieceHorizontalI)).toBe(false);

      // แต่ถ้า I piece วางที่ position.y = -2 บล็อกจะอยู่ที่ y = -2 + 1 = -1 (เหนือกระดาน)
      const pieceOutOfBoundI = createTestPiece('I', 3, -2, 0);
      expect(hasCellsAboveBoard(pieceOutOfBoundI)).toBe(true);
    });

    test('กฎ Lock-Out: หากเกิดกรณีล็อกชิ้นส่วนที่มี cell เหนือกระดาน (y < 0) ถือเป็น Game Over ทันที', () => {
      const board = createEmptyBoard();
      // ชิ้นส่วนจำลองที่มี cell เหนือแถว 0
      const pieceAboveBoard = createTestPiece('T', 3, -1, 0);

      const state: MovementState = {
        board,
        activePiece: pieceAboveBoard,
        isLocking: false,
        gameOver: false,
      };

      const result = performLock(state);

      // ต้องเกิด Lock-Out Game Over
      expect(result.gameOver).toBe(true);
      expect(state.gameOver).toBe(true);
    });

    test('lockActivePieceToBoardStep() ตั้ง gameOver = true เมื่อชิ้นส่วนมีบล็อกเหนือกระดาน', () => {
      const board = createEmptyBoard();
      const pieceAboveBoard = createTestPiece('T', 3, -1, 0);

      let spawnCalled = false;
      const state: MovementState = {
        board,
        activePiece: pieceAboveBoard,
        isLocking: false,
        gameOver: false,
        spawnNextPiece: () => {
          spawnCalled = true;
          return { success: true, linesCleared: [], gameOver: false };
        },
      };

      // 1. กรณีปกติ (ไม่มี Lock-Out): spawnNextPiece ถูกเรียกตามปกติ
      let normalSpawnCalled = false;
      const normalState: MovementState = {
        board: createEmptyBoard(),
        activePiece: createTestPiece('T', 3, 0, 0),
        isLocking: false,
        gameOver: false,
        spawnNextPiece: () => {
          normalSpawnCalled = true;
          return { success: true, linesCleared: [], gameOver: false };
        },
      };
      applyLock(normalState);
      expect(normalSpawnCalled).toBe(false);
      performLock(normalState);
      expect(normalSpawnCalled).toBe(true);

      // 2. กรณี Lock-Out: gameOver = true และ spawnNextPiece ต้องไม่ถูกเรียก
      const nextState = lockActivePieceToBoardStep(state);
      expect(nextState.gameOver).toBe(true);

      // เมื่อ gameOver แล้ว applyLock จะต้องไม่เรียก spawnNextPiece เพิ่ม
      const finalState = applyLock(state);
      expect(finalState.gameOver).toBe(true);
      expect(spawnCalled).toBe(false);

      performLock(state);
      expect(state.gameOver).toBe(true);
      expect(spawnCalled).toBe(false);
    });
  });

  describe('เกณฑ์ที่ 3: มี test ครอบคลุมการหมุนที่ขอบบน', () => {
    test('ทดสอบกรณีหลักฐานจาก Bug Report: T-piece ที่ spawn (x:3, y:0) หมุนด้วย kick ที่ถูกจำกัด', () => {
      // จำลองเหตุการณ์:
      // T-piece อยู่ที่ตำแหน่ง spawn (x:3, y:0)
      // เมื่อบล็อก offset [0, 0] และ [-1, 0]
      // Kick [-1, -1] ถูก reject ทำให้ไม่เกิดการหลุดไป y = -1
      // และเมื่อทำการล็อก บล็อกบนกระดานต้องเพิ่มขึ้นครบ 4 บล็อก
      let board = createEmptyBoard();
      // บล็อกเฉพาะ (4, 0) เพื่อให้ offset [0, 0] ชน
      board = setCell(board, 4, 0, 'I');
      // บล็อก (3, 0) เพื่อให้ offset [-1, 0] ชน
      board = setCell(board, 3, 0, 'I');

      const engine = new TetrisEngine();
      engine.setBoard(board);
      engine.setActivePiece(createTestPiece('T', 3, 0, 0));

      const cellsBefore = countOccupiedCells(engine.getBoard());
      expect(cellsBefore).toBe(2);

      const rotResult = engine.rotate();
      expect(rotResult.success).toBe(true);

      const activePiece = engine.getActivePiece()!;
      // Piece ต้องไม่หลุดไปที่ y = -1
      expect(activePiece.position.y).not.toBe(-1);
      expect(activePiece.position.y).toBeGreaterThanOrEqual(0);

      // ทำการล็อกชิ้นส่วนลงกระดาน
      const lockRes = engine.hardDrop();
      expect(lockRes.success).toBe(true);

      const cellsAfter = countOccupiedCells(engine.getBoard());
      // จำนวนเซลล์บนกระดานต้องเพิ่มขึ้น 4 พอดี (2 เดิม + 4 ใหม่ = 6)
      expect(cellsAfter - cellsBefore).toBe(4);
      expect(cellsAfter).toBe(6);
    });

    test('I-piece หมุนที่ตำแหน่ง spawn (x:3, y:0) จากแนวนอนเป็นแนวตั้ง ทุก cell อยู่ใน board', () => {
      const engine = new TetrisEngine();
      engine.setActivePiece(createTestPiece('I', 3, 0, 0));

      const result = engine.rotate();
      expect(result.success).toBe(true);

      const snapshot = engine.getRenderSnapshot();
      expect(snapshot.activePiece.rotation).toBe(1);
      // I rot 1 อยู่ที่ col 2 (x=5), row 0..3 (y=0..3)
      expect(snapshot.activePiece.position.y).toBe(0);

      for (let r = 0; r < snapshot.activePiece.shape.length; r++) {
        for (let c = 0; c < snapshot.activePiece.shape[r]!.length; c++) {
          if (snapshot.activePiece.shape[r]![c]) {
            const cellY = snapshot.activePiece.position.y + r;
            expect(cellY).toBeGreaterThanOrEqual(0);
            expect(cellY).toBeLessThan(20);
          }
        }
      }
    });

    test('หมุนต่อเนื่อง 4 ครั้งที่แถวบนสุด (0->1->2->3->0) ไม่หลุดออกนอกขอบบนในทุกสถานะ', () => {
      const engine = new TetrisEngine();
      engine.setActivePiece(createTestPiece('T', 3, 0, 0));

      for (let step = 0; step < 4; step++) {
        const result = engine.rotate();
        expect(result.success).toBe(true);

        const piece = engine.getActivePiece()!;
        for (let r = 0; r < piece.shape.length; r++) {
          for (let c = 0; c < piece.shape[r]!.length; c++) {
            if (piece.shape[r]![c]) {
              const cellY = piece.position.y + r;
              expect(cellY).toBeGreaterThanOrEqual(0);
              expect(cellY).toBeLessThan(20);
            }
          }
        }
      }

      // ครบ 4 รอบกลับมา rotation 0
      const finalPiece = engine.getActivePiece()!;
      expect(finalPiece.rotation).toBe(0);
      expect(finalPiece.position.y).toBeGreaterThanOrEqual(0);
    });

    test('L-piece และ J-piece หมุนที่แถวบนสุด (y=0) สำเร็จโดยไม่มี cell ใดหลุดออกนอก board', () => {
      for (const type of ['L', 'J'] as const) {
        const engine = new TetrisEngine();
        engine.setActivePiece(createTestPiece(type, 3, 0, 0));

        const result = engine.rotate();
        expect(result.success).toBe(true);

        const piece = engine.getActivePiece()!;
        for (let r = 0; r < piece.shape.length; r++) {
          for (let c = 0; c < piece.shape[r]!.length; c++) {
            if (piece.shape[r]![c]) {
              const cellY = piece.position.y + r;
              expect(cellY).toBeGreaterThanOrEqual(0);
            }
          }
        }
      }
    });

    test('S-piece และ Z-piece หมุนที่แถวบนสุด (y=0) สำเร็จโดยไม่มี cell ใดหลุดออกนอก board', () => {
      for (const type of ['S', 'Z'] as const) {
        const engine = new TetrisEngine();
        engine.setActivePiece(createTestPiece(type, 3, 0, 0));

        const result = engine.rotate();
        expect(result.success).toBe(true);

        const piece = engine.getActivePiece()!;
        for (let r = 0; r < piece.shape.length; r++) {
          for (let c = 0; c < piece.shape[r]!.length; c++) {
            if (piece.shape[r]![c]) {
              const cellY = piece.position.y + r;
              expect(cellY).toBeGreaterThanOrEqual(0);
            }
          }
        }
      }
    });

    test('เมื่อทุก kick offset ถูกบล็อกที่ขอบบน การหมุนต้องล้มเหลว (success: false) และคง state เดิม', () => {
      // สร้างบอร์ดที่ปิดกั้นทุกช่องรอบตัว
      let board = createEmptyBoard();
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 10; x++) {
          board = setCell(board, x, y, 'I');
        }
      }
      // เจาะรูพอดีกับ T rot 0 ที่ position (3, 0)
      board = setCell(board, 4, 0, 0);
      board = setCell(board, 3, 1, 0);
      board = setCell(board, 4, 1, 0);
      board = setCell(board, 5, 1, 0);

      const engine = new TetrisEngine();
      engine.setBoard(board);
      engine.setActivePiece(createTestPiece('T', 3, 0, 0));

      const beforePiece = engine.getActivePiece()!;
      const result = engine.rotate();

      expect(result.success).toBe(false);
      const afterPiece = engine.getActivePiece()!;
      expect(afterPiece.position).toEqual(beforePiece.position);
      expect(afterPiece.rotation).toBe(beforePiece.rotation);
    });
  });
});
