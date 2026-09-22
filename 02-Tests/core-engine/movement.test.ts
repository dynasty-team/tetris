// 02-Tests/core-engine/movement.test.ts
import { describe, expect, test, beforeEach } from 'bun:test';
import type { Board, ActivePiece, TetrominoType, ActionResult } from '../../01-Source-code/shared/types';
import { createEmptyBoard, setCell } from '../../01-Source-code/shared/board-utils';
import { LOCK_DELAY_MS, MAX_LOCK_RESETS } from '../../01-Source-code/shared/constants';
import { getShape, rotatePiece } from '../../01-Source-code/core-engine/tetromino-shapes';
import {
  moveLeft,
  moveRight,
  softDrop,
  rotate,
  hardDrop,
  isPieceOnGround,
  lockPieceToBoard,
  performLock,
  type MovementState,
} from '../../01-Source-code/core-engine/movement';
import {
  lockActivePieceToBoardStep,
  clearFullLinesStep,
  spawnNextPieceStep,
  applyLock,
} from '../../01-Source-code/core-engine/lock-pipeline';
import { TetrisEngine } from '../../01-Source-code/core-engine/TetrisEngine';

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

function createLockPipelineState(): MovementState {
  const board = createEmptyBoard();
  const bottomRow = board[19]!;

  for (let column = 0; column < 3; column++) {
    bottomRow[column] = 'T';
  }
  for (let column = 7; column < 10; column++) {
    bottomRow[column] = 'T';
  }

  return {
    board,
    activePiece: createTestPiece('I', 3, 18),
    isLocking: false,
    linesClearedTotal: 0,
  };
}

describe('Movement & Lock Delay System (C4)', () => {
  test('pipe(lockActivePieceToBoardStep, clearFullLinesStep, spawnNextPieceStep) ให้ผลตรงกับเรียกทีละขั้นเอง และทำงานแบบ Pure/Immutable', () => {
    const baseState = createLockPipelineState();
    const spawnNextPiece = () => ({ success: true, linesCleared: [], gameOver: false });
    const stateA = { ...baseState, spawnNextPiece };
    const stateB = structuredClone(baseState);
    stateB.spawnNextPiece = spawnNextPiece;

    const resultA = applyLock(stateA);

    const step1 = lockActivePieceToBoardStep(stateB);
    const step2 = clearFullLinesStep(step1);
    const resultB = spawnNextPieceStep(step2);

    expect(resultA.board).toEqual(resultB.board);
    expect(resultA.linesClearedTotal).toEqual(resultB.linesClearedTotal);

    // ตรวจสอบความเป็น Pure Function / Immutability: stateA และ stateB ไม่ถูก mutate
    expect(stateA.board).not.toBe(resultA.board);
    expect(stateB.board).not.toBe(resultB.board);
    expect(stateA.board).toEqual(baseState.board);
    expect(stateB.board).toEqual(baseState.board);
  });

  test('lockActivePieceToBoardStep คืน state เดิมเมื่อ activePiece เป็น null', () => {
    const baseState = createLockPipelineState();
    baseState.activePiece = null;
    const result = lockActivePieceToBoardStep(baseState);
    expect(result.activePiece).toBeNull();
    expect(result.board).toBe(baseState.board);
  });

  describe('1. Directional Movement (moveLeft, moveRight, softDrop)', () => {
    test('moveLeft() ขยับไปทางซ้าย 1 ช่องสำเร็จเมื่อทางโล่ง', () => {
      const engine = new TetrisEngine();
      engine.setActivePiece(createTestPiece('T', 4, 5));

      const result = engine.moveLeft();

      expect(result.success).toBe(true);
      const snapshot = engine.getRenderSnapshot();
      expect(snapshot.activePiece.position.x).toBe(3);
      expect(snapshot.activePiece.position.y).toBe(5);
    });

    test('moveLeft() ชนขอบซ้าย คืน success: false และตำแหน่ง x ไม่เปลี่ยน', () => {
      const engine = new TetrisEngine();
      // T piece: บล็อกซ้ายสุดอยู่ที่ col 0 (เมื่อ shape คือ [0,1,0], [1,1,1])
      // ดังนั้นถ้า position.x = 0, บล็อก [1,1,1] จะเริ่มที่ x = 0
      // หากพยายามขยับไป x = -1 จะหลุดขอบซ้าย
      engine.setActivePiece(createTestPiece('T', 0, 5));

      const result = engine.moveLeft();

      expect(result.success).toBe(false);
      const snapshot = engine.getRenderSnapshot();
      expect(snapshot.activePiece.position.x).toBe(0);
    });

    test('moveLeft() ชนบล็อกที่วางอยู่ด้านซ้าย คืน success: false และตำแหน่งไม่เปลี่ยน', () => {
      const engine = new TetrisEngine();
      let board = createEmptyBoard();
      // วางบล็อกที่ (x=2, y=6)
      board = setCell(board, 2, 6, 'I');
      engine.setBoard(board);
      // T piece อยู่ที่ x=3, y=5 -> บล็อกล่างซ้ายอยู่ที่ (3+0=3, 5+1=6)
      // ถ้าขยับซ้าย จะไปทับที่ (2, 6)
      engine.setActivePiece(createTestPiece('T', 3, 5));

      const result = engine.moveLeft();

      expect(result.success).toBe(false);
      expect(engine.getRenderSnapshot().activePiece.position.x).toBe(3);
    });

    test('moveRight() ขยับไปทางขวา 1 ช่องสำเร็จเมื่อทางโล่ง', () => {
      const engine = new TetrisEngine();
      engine.setActivePiece(createTestPiece('T', 4, 5));

      const result = engine.moveRight();

      expect(result.success).toBe(true);
      expect(engine.getRenderSnapshot().activePiece.position.x).toBe(5);
      expect(engine.getRenderSnapshot().activePiece.position.y).toBe(5);
    });

    test('moveRight() ชนขอบขวา คืน success: false และตำแหน่ง x ไม่เปลี่ยน', () => {
      const engine = new TetrisEngine();
      // T piece spawn (rot 0): แถว 1 คือ [1, 1, 1, 0] -> บล็อกขวาสุดอยู่ที่ col 2
      // ถ้า position.x = 7 บล็อกขวาสุดจะอยู่ที่ 7 + 2 = 9 (ชิดขอบขวา)
      // หากพยายามขยับขวาไป x = 8 จะชนขอบขวา (x=10)
      engine.setActivePiece(createTestPiece('T', 7, 5));

      const result = engine.moveRight();

      expect(result.success).toBe(false);
      expect(engine.getRenderSnapshot().activePiece.position.x).toBe(7);
    });

    test('moveRight() ชนบล็อกที่วางอยู่ด้านขวา คืน success: false และตำแหน่งไม่เปลี่ยน', () => {
      const engine = new TetrisEngine();
      let board = createEmptyBoard();
      // วางบล็อกที่ (x=6, y=6)
      board = setCell(board, 6, 6, 'J');
      engine.setBoard(board);
      // T piece อยู่ที่ x=3, y=5 -> บล็อกขวาสุดอยู่ที่ (3+2=5, 5+1=6)
      // ถ้าขยับขวา บล็อกขวาจะไปชนที่ (6, 6)
      engine.setActivePiece(createTestPiece('T', 3, 5));

      const result = engine.moveRight();

      expect(result.success).toBe(false);
      expect(engine.getRenderSnapshot().activePiece.position.x).toBe(3);
    });

    test('softDrop() เลื่อนลง 1 ช่องสำเร็จเมื่อยังไม่ชนพื้น', () => {
      const engine = new TetrisEngine();
      engine.setActivePiece(createTestPiece('T', 4, 5));

      const result = engine.softDrop();

      expect(result.success).toBe(true);
      expect(engine.getRenderSnapshot().activePiece.position.y).toBe(6);
      expect(engine.getRenderSnapshot().activePiece.position.x).toBe(4);
    });

    test('softDrop() ชนพื้นกระดาน คืน success: false ตำแหน่ง y ไม่เปลี่ยน และเข้าสู่ lock delay', () => {
      const engine = new TetrisEngine();
      // T piece spawn (rot 0): บล็อกล่างสุดอยู่ที่ row 1
      // ถ้า position.y = 18 บล็อกล่างสุดจะอยู่ที่ y = 18 + 1 = 19 (ชิดพื้น)
      // softDrop ต่อไปจะชนพื้น (y=20)
      engine.setActivePiece(createTestPiece('T', 4, 18));

      const result = engine.softDrop();

      expect(result.success).toBe(false);
      expect(engine.getRenderSnapshot().activePiece.position.y).toBe(18);
      expect(engine.getRenderSnapshot().isLocking).toBe(true);
    });

    test('softDrop() ชนบล็อกที่วางอยู่ด้านล่าง คืน success: false ตำแหน่งไม่เปลี่ยน และเข้าสู่ lock delay', () => {
      const engine = new TetrisEngine();
      let board = createEmptyBoard();
      // วางบล็อกที่ (x=4, y=10)
      board = setCell(board, 4, 10, 'O');
      engine.setBoard(board);
      // T piece อยู่ที่ (x=4, y=8) -> บล็อกล่างอยู่ที่ row 1 คือ y = 8+1 = 9
      // เลื่อนลงไป y=9 จะทำให้ row 1 อยู่ที่ y=10 ซึ่งชนกับบล็อกเดิม
      engine.setActivePiece(createTestPiece('T', 4, 8));

      const result = engine.softDrop();

      expect(result.success).toBe(false);
      expect(engine.getRenderSnapshot().activePiece.position.y).toBe(8);
      expect(engine.getRenderSnapshot().isLocking).toBe(true);
    });

    test('rotate() หมุนตามเข็มนาฬิกาสำเร็จเมื่อไม่มีสิ่งกีดขวาง', () => {
      const engine = new TetrisEngine();
      engine.setActivePiece(createTestPiece('T', 4, 5, 0));

      const result = engine.rotate();

      expect(result.success).toBe(true);
      expect(engine.getRenderSnapshot().activePiece.rotation).toBe(1);
    });

    test('rotate() ล้มเหลวเมื่อหมุนแล้วชนบล็อก คืน success: false และ rotation ไม่เปลี่ยน', () => {
      // เดิมทดสอบด้วยบล็อกกีดขวางแค่ 1 ตำแหน่ง แต่ระบบ SRS wall-kick มี offset สำรองถึง 5 ตำแหน่ง
      // (ซ้าย/ขวา/ขึ้น) การกีดขวางแค่จุดเดียวจึงไม่พอจะทำให้หมุนไม่สำเร็จอีกต่อไป — ต้องล้อมกรอบ
      // ให้ครอบคลุมทุกตำแหน่งที่ offset ทั้ง 5 ของ JLSTZ_KICKS[0] จะไปตกลง (คอลัมน์ 3-6, แถว 4-9)
      // เพื่อยืนยันว่าเมื่อ "ชนจริงทุก offset" การหมุนต้องล้มเหลวและคง rotation เดิมไว้
      const engine = new TetrisEngine();
      let board = createEmptyBoard();
      for (let y = 4; y <= 9; y++) {
        for (let x = 3; x <= 6; x++) {
          board = setCell(board, x, y, 'Z');
        }
      }
      engine.setBoard(board);
      engine.setActivePiece(createTestPiece('T', 4, 5, 0));

      const result = engine.rotate();

      expect(result.success).toBe(false);
      expect(engine.getRenderSnapshot().activePiece.rotation).toBe(0);
    });

    test('rotate() ใช้ SRS wall-kick เลื่อนขึ้น (และข้าง) เท่าที่จำเป็นเมื่อชิ้นส่วนแตะพื้น', () => {
      // T piece ที่ (4, 18) rotation 0 อยู่ชิดพื้นพอดี (row ล่างสุดของ shape อยู่ที่ y=19)
      // การหมุนตรงตำแหน่งเดิม (offset [0,0]) และ offset [-1,0] จะพา piece ทะลุพื้น (y=20)
      // ตาราง JLSTZ_KICKS ฝั่ง fromRotation=0 มี offset ลำดับที่ 3 คือ [-1,-1] ซึ่งขยับทั้งซ้าย
      // และขึ้น 1 ช่องพร้อมกัน — เป็น offset แรกที่ไม่ชนบนกระดานว่าง จึงเป็นคำตอบ
      const engine = new TetrisEngine();
      engine.setActivePiece(createTestPiece('T', 4, 18, 0));

      const result = engine.rotate();

      expect(result.success).toBe(true);
      expect(engine.getRenderSnapshot().activePiece.rotation).toBe(1);
      expect(engine.getRenderSnapshot().activePiece.position.x).toBe(3);
      expect(engine.getRenderSnapshot().activePiece.position.y).toBe(17);
    });

    test('rotate() ไม่ใช้ wall-kick เพื่อหลบผ่านบล็อกที่กีดขวางจริง', () => {
      // วางบล็อกกีดขวางที่ (5, 18) ซึ่งตรงกับตำแหน่งที่ offset [-1,-1] (คำตอบของเทสก่อนหน้า)
      // ต้องใช้ในการหมุน ทำให้ offset นั้นชนไปด้วย และ offset ที่เหลือ ([0,2], [-1,2]) ก็ยังชน
      // พื้น/ทะลุขอบกระดานอยู่ดี รวมทุก offset ชนหมด -> หมุนไม่สำเร็จ ตำแหน่ง/rotation เดิม
      const engine = new TetrisEngine();
      let board = createEmptyBoard();
      board = setCell(board, 5, 18, 'Z');
      engine.setBoard(board);
      engine.setActivePiece(createTestPiece('T', 4, 18, 0));

      const result = engine.rotate();

      expect(result.success).toBe(false);
      expect(engine.getRenderSnapshot().activePiece.rotation).toBe(0);
      expect(engine.getRenderSnapshot().activePiece.position.x).toBe(4);
      expect(engine.getRenderSnapshot().activePiece.position.y).toBe(18);
    });
  });

  describe('2. Lock Delay Initiation & RenderSnapshot.isLocking', () => {
    test('เมื่อ piece แตะพื้น จะยังไม่ lock ทันที แต่ isLocking จะเป็น true', () => {
      const engine = new TetrisEngine();
      // วางชิดพื้น (T piece at y=18)
      engine.setActivePiece(createTestPiece('T', 4, 18));

      expect(isPieceOnGround(engine.board, engine.getRenderSnapshot().activePiece)).toBe(true);
      expect(engine.getRenderSnapshot().isLocking).toBe(true);
      // ตรวจสอบว่าชิ้นส่วนยังไม่ถูกเขียนลง board
      expect(engine.board[19]![4]).toBe(0);
    });

    test('ในระหว่าง Lock delay ผู้เล่นยังสามารถขยับซ้าย/ขวา และหมุนชิ้นส่วนได้', () => {
      const engine = new TetrisEngine();
      engine.setActivePiece(createTestPiece('T', 4, 18));

      // ขยับซ้ายบนพื้น
      const moveLeftRes = engine.moveLeft();
      expect(moveLeftRes.success).toBe(true);
      expect(engine.getRenderSnapshot().activePiece.position.x).toBe(3);
      expect(engine.getRenderSnapshot().isLocking).toBe(true);

      // ขยับขวาบนพื้น
      const moveRightRes = engine.moveRight();
      expect(moveRightRes.success).toBe(true);
      expect(engine.getRenderSnapshot().activePiece.position.x).toBe(4);
      expect(engine.getRenderSnapshot().isLocking).toBe(true);

      // หมุนบนพื้น
      const rotateRes = engine.rotate();
      expect(rotateRes.success).toBe(true);
      expect(engine.getRenderSnapshot().activePiece.rotation).toBe(1);
      expect(engine.getRenderSnapshot().isLocking).toBe(true);
    });

    test('ถ้าขยับออกจากพื้นลงสู่ที่ว่าง (Ledge) สถานะ isLocking จะถูกยกเลิก (false)', () => {
      const engine = new TetrisEngine();
      let board = createEmptyBoard();
      // สร้างแท่นบล็อกที่ x=3, y=10
      board = setCell(board, 3, 10, 'I');
      engine.setBoard(board);

      // T piece วางอยู่บนแท่นบล็อกพอดี (บล็อกล่าง col 0 อยู่ที่ x=3, y=9)
      engine.setActivePiece(createTestPiece('T', 3, 8));
      expect(engine.getRenderSnapshot().isLocking).toBe(true);

      // ขยับขวาไปที่ x=4 พ้นจากแท่นบล็อก -> ด้านล่างกลายเป็นที่ว่าง
      engine.moveRight();
      expect(engine.getRenderSnapshot().activePiece.position.x).toBe(4);
      expect(engine.getRenderSnapshot().isLocking).toBe(false);
    });
  });

  describe('3. Lock Delay Resets & 15-Move Rule (MAX_LOCK_RESETS)', () => {
    test('ขยับหรือหมุนสำเร็จขณะแตะพื้น จะรีเซ็ต timer และนับจำนวน reset', () => {
      const engine = new TetrisEngine();
      engine.setActivePiece(createTestPiece('T', 4, 18));

      expect(engine.lockResets).toBe(0);

      engine.moveLeft();
      expect(engine.lockResets).toBe(1);

      engine.moveRight();
      expect(engine.lockResets).toBe(2);

      engine.rotate();
      expect(engine.lockResets).toBe(3);
    });

    test('การขยับ/หมุนที่ล้มเหลว (ชนขอบหรือบล็อก) จะไม่นับเป็น reset และไม่รีเซ็ต timer', () => {
      const engine = new TetrisEngine();
      // นำไปวางชิดมุมซ้ายล่าง
      engine.setActivePiece(createTestPiece('T', 0, 18));
      const initialResets = engine.lockResets;

      // พยายามขยับซ้ายชนกำแพง
      const res = engine.moveLeft();
      expect(res.success).toBe(false);
      // จำนวน reset ต้องไม่เพิ่มขึ้น
      expect(engine.lockResets).toBe(initialResets);
    });

    test('ขยับ/หมุนสะสมถึง MAX_LOCK_RESETS (15 ครั้ง) ระหว่าง lock delay -> ล็อกลงกระดานทันที', () => {
      const engine = new TetrisEngine();
      engine.setActivePiece(createTestPiece('T', 4, 18));

      // ขยับซ้าย/ขวาสลับกันไปเรื่อยๆ จนถึง 14 ครั้ง
      for (let i = 0; i < 14; i++) {
        if (i % 2 === 0) {
          engine.moveLeft();
        } else {
          engine.moveRight();
        }
        expect(engine.getRenderSnapshot().isLocking).toBe(true);
      }

      expect(engine.lockResets).toBe(14);

      // ครั้งที่ 15: ครบ MAX_LOCK_RESETS (15) -> ต้องล็อกทันที
      engine.moveLeft();

      // ชิ้นส่วนเดิมต้องถูกล็อกลงบน board แล้ว
      // และชิ้นส่วนใหม่ถูก spawn ออกมา
      const snapshot = engine.getRenderSnapshot();
      expect(snapshot.isLocking).toBe(false);
      // ตรวจสอบว่ามีบล็อก 'T' อยู่บนกระดานแถวล่าง (y=19)
      const hasLockedCells = snapshot.board[19]!.some((cell) => cell === 'T');
      expect(hasLockedCells).toBe(true);
      // Active piece ใหม่ต้องอยู่ที่ตำแหน่ง spawn ด้านบน (y=0)
      expect(snapshot.activePiece.position.y).toBe(0);
    });

    test('หมุน piece บนกระดานที่เกือบเต็ม 2 แถว ครบ 15 ครั้ง -> ActionResult.linesCleared ไม่ว่าง และ onLock ถูกเรียกถูกต้อง', () => {
      const engine = new TetrisEngine();
      let onLockCalledWith = null as ActionResult | null;
      engine.onLock = (result) => {
        onLockCalledWith = result;
      };

      // สร้างกระดานที่เกือบเต็ม 2 แถวล่าง (แถว 18 และ 19)
      // เว้นช่องตรงกลาง x=4, x=5 ไว้สำหรับ O piece (ขนาด 2x2)
      let board = createEmptyBoard();
      for (let x = 0; x < 10; x++) {
        if (x !== 4 && x !== 5) {
          board = setCell(board, x, 18, 'I');
          board = setCell(board, x, 19, 'I');
        }
      }
      engine.setBoard(board);

      // วาง O piece ที่ตำแหน่ง x=3, y=18 (เซลล์ของ O piece จะอยู่ที่ x=4, 5 พอดี และแตะพื้นพอดี)
      engine.setActivePiece(createTestPiece('O', 3, 18));
      expect(engine.getRenderSnapshot().isLocking).toBe(true);

      // หมุน O piece 14 ครั้งแรก (isLocking ยังเป็น true, lockResets เพิ่มขึ้น)
      for (let i = 0; i < 14; i++) {
        const res = engine.rotate();
        expect(res.success).toBe(true);
        expect(res.linesCleared).toEqual([]);
        expect(engine.getRenderSnapshot().isLocking).toBe(true);
      }
      expect(engine.lockResets).toBe(14);
      expect(onLockCalledWith).toBeNull();

      // ครั้งที่ 15: ครบ MAX_LOCK_RESETS (15) -> auto-lock ทันที
      const finalResult = engine.rotate();
      expect(finalResult.success).toBe(true);
      // assert ว่า linesCleared ไม่ว่าง และเคลียร์แถว 18, 19 จริง
      expect(finalResult.linesCleared.length).toBe(2);
      expect(finalResult.linesCleared).toEqual([18, 19]);

      // onLock callback ต้องถูกเรียกด้วยผลลัพธ์ที่ถูกต้อง
      expect(onLockCalledWith).not.toBeNull();
      expect(onLockCalledWith?.success).toBe(true);
      expect(onLockCalledWith?.linesCleared).toEqual([18, 19]);
      expect(engine.getLinesClearedTotal()).toBe(2);
    });

    test('หมุน piece บนกระดานที่เกือบเต็ม 1 แถว ครบ 15 ครั้ง -> ActionResult.linesCleared ไม่ว่าง และ onLock ถูกเรียกถูกต้อง', () => {
      const engine = new TetrisEngine();
      let onLockCalledWith = null as ActionResult | null;
      engine.onLock = (result) => {
        onLockCalledWith = result;
      };

      // สร้างแถว 19 เกือบเต็ม เว้น x=4, 5 สำหรับ O piece (2x2)
      let board = createEmptyBoard();
      for (let x = 0; x < 10; x++) {
        if (x !== 4 && x !== 5) {
          board = setCell(board, x, 19, 'I');
        }
      }
      engine.setBoard(board);

      // วาง O piece ที่ตำแหน่ง x=4, y=18 (แถวล่างของ O piece อยู่ที่แถว 19 แตะพื้นพอดี)
      engine.setActivePiece(createTestPiece('O', 3, 18));
      expect(engine.getRenderSnapshot().isLocking).toBe(true);

      // หมุน 14 ครั้งแรก
      for (let i = 0; i < 14; i++) {
        const res = engine.rotate();
        expect(res.success).toBe(true);
        expect(res.linesCleared).toEqual([]);
      }
      expect(engine.lockResets).toBe(14);
      expect(onLockCalledWith).toBeNull();

      // ครั้งที่ 15: ครบ 15 ครั้ง -> auto-lock เคลียร์แถว 19
      const finalResult = engine.rotate();
      expect(finalResult.success).toBe(true);
      expect(finalResult.linesCleared.length).toBe(1);
      expect(finalResult.linesCleared).toEqual([19]);

      expect(onLockCalledWith).not.toBeNull();
      expect(onLockCalledWith?.success).toBe(true);
      expect(onLockCalledWith?.linesCleared).toEqual([19]);
      expect(engine.getLinesClearedTotal()).toBe(1);
    });

    test('softDrop() เมื่อแตะพื้นและสะสม lock resets ครบ 15 ครั้ง -> ActionResult.linesCleared ไม่ว่าง และ onLock ถูกเรียกถูกต้อง', () => {
      const engine = new TetrisEngine();
      let onLockCalledWith = null as ActionResult | null;
      engine.onLock = (result) => {
        onLockCalledWith = result;
      };

      // สร้างกระดานเกือบเต็ม 2 แถวล่าง (แถว 18 และ 19)
      let board = createEmptyBoard();
      for (let x = 0; x < 10; x++) {
        if (x !== 4 && x !== 5) {
          board = setCell(board, x, 18, 'I');
          board = setCell(board, x, 19, 'I');
        }
      }
      engine.setBoard(board);

      // วาง O piece ที่ x=4, y=18 (แตะพื้น)
      engine.setActivePiece(createTestPiece('O', 3, 18));

      // สะสม resets จากการหมุน 14 ครั้ง
      for (let i = 0; i < 14; i++) {
        engine.rotate();
      }
      expect(engine.lockResets).toBe(14);
      expect(onLockCalledWith).toBeNull();

      // ตั้งตำแหน่ง activePiece อยู่ที่ y=17 โดยรักษาสถานะ isLocking = true และ lockResets = 14
      // เพื่อจำลองกรณีที่ piece อยู่ระหว่าง lock delay แล้ว softDrop ลงมาแตะพื้นเป็นครั้งที่ 15
      const piece = engine.getActivePiece()!;
      engine.activePiece = {
        ...piece,
        position: { ...piece.position, y: 17 },
      };
      engine.isLocking = true;
      engine.lockResets = 14;

      // softDrop เลื่อนลง 1 ช่องมาที่ y=18 และแตะพื้น นับเป็น reset ครั้งที่ 15 -> auto-lock ทันที
      const dropResult = engine.softDrop();
      expect(dropResult.success).toBe(true);
      expect(dropResult.linesCleared.length).toBe(2);
      expect(dropResult.linesCleared).toEqual([18, 19]);
      expect(onLockCalledWith).not.toBeNull();
      expect(onLockCalledWith?.linesCleared).toEqual([18, 19]);
      expect(engine.getLinesClearedTotal()).toBe(2);
    });
  });

  describe('4. Lock Delay Timeout & Auto Lock', () => {
    test('เมื่อครบเวลา 500ms (LOCK_DELAY_MS) โดยไม่มีการขยับเพิ่ม ชิ้นส่วนจะล็อกลงกระดานและ spawn ใหม่ทันที', async () => {
      const engine = new TetrisEngine();
      // กำหนด next piece เพื่อตรวจสอบการ spawn
      engine.nextPiece = 'I';
      engine.setActivePiece(createTestPiece('T', 4, 18));

      expect(engine.getRenderSnapshot().isLocking).toBe(true);

      // รอให้ครบ 500ms Lock delay (รอ 550ms เพื่อให้ setTimeout ทำงาน)
      await new Promise((resolve) => setTimeout(resolve, LOCK_DELAY_MS + 50));

      const snapshot = engine.getRenderSnapshot();
      expect(snapshot.isLocking).toBe(false);

      // ชิ้นส่วนเดิม (T) ล็อกลงกระดานเรียบร้อย
      const floorRow = snapshot.board[19]!;
      expect(floorRow.includes('T')).toBe(true);

      // ชิ้นส่วนใหม่ (I) ถูก spawn ออกมาแทนที่
      expect(snapshot.activePiece.type).toBe('I');
      expect(snapshot.activePiece.position.y).toBe(0);
    });
  });

  describe('5. Hard Drop & Immediate Lock', () => {
    test('hardDrop() ข้าม lock delay ทิ้งตัวลงพื้นและล็อกทันที', () => {
      const engine = new TetrisEngine();
      engine.nextPiece = 'O';
      engine.setActivePiece(createTestPiece('T', 4, 0));

      const result = engine.hardDrop();

      expect(result.success).toBe(true);
      const snapshot = engine.getRenderSnapshot();

      // ตรวจสอบว่าถูกล็อกลงกระดานทันที
      const floorRow = snapshot.board[19]!;
      expect(floorRow.includes('T')).toBe(true);

      // ชิ้นส่วนใหม่ (O) spawn ทันที และ isLocking เป็น false
      expect(snapshot.activePiece.type).toBe('O');
      expect(snapshot.isLocking).toBe(false);
    });
  });

  describe('6. Pure Movement Functions with Plain State Object', () => {
    test('moveLeft(state), moveRight(state), softDrop(state) ใช้งานกับ Plain State ได้และคืน state ที่อัปเดต', () => {
      const board = createEmptyBoard();
      const piece = createTestPiece('T', 5, 5);

      const state: MovementState = {
        board,
        activePiece: piece,
        isLocking: false,
        lockResets: 0,
        gameOver: false,
      };

      // moveLeft
      const resLeft = moveLeft(state);
      expect(resLeft.success).toBe(true);
      expect(resLeft.state?.activePiece?.position.x).toBe(4);
      expect(state.activePiece?.position.x).toBe(4);

      // moveRight
      const resRight = moveRight(state);
      expect(resRight.success).toBe(true);
      expect(resRight.state?.activePiece?.position.x).toBe(5);

      // softDrop
      const resDrop = softDrop(state);
      expect(resDrop.success).toBe(true);
      expect(resDrop.state?.activePiece?.position.y).toBe(6);
    });

    test('lockPieceToBoard() ประทับเซลล์ของชิ้นส่วนลงบนกระดานได้อย่างถูกต้อง', () => {
      const board = createEmptyBoard();
      const piece = createTestPiece('O', 2, 18);

      lockPieceToBoard(board, piece);

      // O piece: ขนาด 2x2 อยู่ที่ row 0-1, col 1-2
      // position (x=2, y=18) -> (x=3, y=18), (x=4, y=18), (x=3, y=19), (x=4, y=19)
      expect(board[18]![3]).toBe('O');
      expect(board[18]![4]).toBe('O');
      expect(board[19]![3]).toBe('O');
      expect(board[19]![4]).toBe('O');
    });
  });

  describe('7. Game Over / Top-Out Protection', () => {
    test('ไม่สามารถขยับชิ้นส่วนได้หากสถานะ gameOver เป็น true', () => {
      const engine = new TetrisEngine();
      engine.setActivePiece(createTestPiece('T', 4, 5));
      // บังคับ gameOver
      engine.gameOver = true;

      const leftRes = engine.moveLeft();
      expect(leftRes.success).toBe(false);
      expect(leftRes.gameOver).toBe(true);

      const rightRes = engine.moveRight();
      expect(rightRes.success).toBe(false);

      const dropRes = engine.softDrop();
      expect(dropRes.success).toBe(false);

      const rotRes = engine.rotate();
      expect(rotRes.success).toBe(false);
    });
  });
});