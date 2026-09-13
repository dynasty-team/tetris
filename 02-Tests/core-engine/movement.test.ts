// 02-Tests/core-engine/movement.test.ts
import { describe, expect, test, beforeEach } from 'bun:test';
import type { Board, ActivePiece, TetrominoType } from '../../01-Source-code/shared/types';
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
  test('pipe(lockActivePieceToBoardStep, clearFullLinesStep, spawnNextPieceStep) ให้ผลตรงกับเรียกทีละขั้นเอง', () => {
    const baseState = createLockPipelineState();
    const spawnNextPiece = () => ({ success: true, linesCleared: [], gameOver: false });
    const stateA = { ...baseState, spawnNextPiece };
    const stateB = structuredClone(baseState);
    stateB.spawnNextPiece = spawnNextPiece;

    applyLock(stateA);

    const step1 = lockActivePieceToBoardStep(stateB);
    const step2 = clearFullLinesStep(step1);
    spawnNextPieceStep(step2);

    expect(stateA.board).toEqual(stateB.board);
    expect(stateA.linesClearedTotal).toEqual(stateB.linesClearedTotal);
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
      const engine = new TetrisEngine();
      let board = createEmptyBoard();
      // T piece rotation 1 (ชี้ขวา): row 2 col 1 คือบล็อกล่าง (4+1=5, y=5+2=7)
      board = setCell(board, 5, 7, 'Z');
      engine.setBoard(board);
      engine.setActivePiece(createTestPiece('T', 4, 5, 0));

      const result = engine.rotate();

      expect(result.success).toBe(false);
      expect(engine.getRenderSnapshot().activePiece.rotation).toBe(0);
    });

    test('rotate() ทำ floor-kick ขึ้นเท่าที่จำเป็นเมื่อชิ้นส่วนแตะพื้น', () => {
      const engine = new TetrisEngine();
      engine.setActivePiece(createTestPiece('T', 4, 18, 0));

      const result = engine.rotate();

      expect(result.success).toBe(true);
      expect(engine.getRenderSnapshot().activePiece.rotation).toBe(1);
      expect(engine.getRenderSnapshot().activePiece.position.y).toBe(17);
    });

    test('rotate() ไม่ใช้ floor-kick เพื่อหลบผ่านบล็อกที่กีดขวางจริง', () => {
      const engine = new TetrisEngine();
      let board = createEmptyBoard();
      board = setCell(board, 5, 18, 'Z');
      engine.setBoard(board);
      engine.setActivePiece(createTestPiece('T', 4, 18, 0));

      const result = engine.rotate();

      expect(result.success).toBe(false);
      expect(engine.getRenderSnapshot().activePiece.rotation).toBe(0);
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
