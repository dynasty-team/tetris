// 02-Tests/core-engine/wall-kick.test.ts
//
// เทสระบบ SRS Wall-Kick — ครอบคลุมการหมุนกลางกระดาน, ชิดกำแพงซ้าย/ขวา, floor-kick,
// buffer zone (y < 0), ช่องแคบที่ kick ไม่ได้เลย, ความแตกต่างของตาราง I piece กับ JLSTZ,
// การไม่ kick ของ O piece, และ round-trip การหมุนครบ 4 รอบ

import { describe, expect, test } from 'bun:test';
import type { Board, ActivePiece, TetrominoType } from '../../01-Source-code/shared/types';
import { createEmptyBoard, setCell } from '../../01-Source-code/shared/board-utils';
import { getShape } from '../../01-Source-code/core-engine/tetromino-shapes';
import { getWallKickOffsets } from '../../01-Source-code/core-engine/wall-kick-data';
import { TetrisEngine } from '../../01-Source-code/core-engine/TetrisEngine';

/** Helper สำหรับสร้าง ActivePiece สำหรับการทดสอบ (รูปแบบเดียวกับ movement.test.ts) */
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

/** สร้างกระดานที่มีแค่ 1 คอลัมน์ว่าง (คอลัมน์ที่เหลือถูกอุดด้วยบล็อกทั้งหมด) เพื่อจำลอง "หลุมแคบ" */
function createNarrowWellBoard(openColumn: number): Board {
  let board = createEmptyBoard();
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y]!.length; x++) {
      if (x !== openColumn) {
        board = setCell(board, x, y, 'I');
      }
    }
  }
  return board;
}

describe('SRS Wall-Kick System', () => {
  test('หมุนกลางกระดานปกติ ไม่มีสิ่งกีดขวาง ใช้ offset [0,0] (test แรก) และไม่ขยับตำแหน่ง', () => {
    const engine = new TetrisEngine();
    engine.setActivePiece(createTestPiece('T', 4, 5, 0));

    const result = engine.rotate();

    expect(result.success).toBe(true);
    const snapshot = engine.getRenderSnapshot();
    expect(snapshot.activePiece.rotation).toBe(1);
    expect(snapshot.activePiece.position.x).toBe(4);
    expect(snapshot.activePiece.position.y).toBe(5);
  });

  test('T piece ชิดกำแพงขวา แล้วหมุน -> kick ไปทางซ้ายได้สำเร็จ (x เปลี่ยน)', () => {
    // T rotation 0 ที่ x=8: บล็อกขวาสุดของ shape ใหม่ (rotation 1) จะทะลุขอบขวา (BOARD_WIDTH=10)
    // ถ้าหมุนตรงตำแหน่งเดิม ต้อง kick ด้วย offset [-1, 0] ถึงจะวางได้
    const engine = new TetrisEngine();
    engine.setActivePiece(createTestPiece('T', 8, 5, 0));

    const result = engine.rotate();

    expect(result.success).toBe(true);
    const snapshot = engine.getRenderSnapshot();
    expect(snapshot.activePiece.rotation).toBe(1);
    expect(snapshot.activePiece.position.x).toBe(7);
    expect(snapshot.activePiece.position.y).toBe(5);
  });

  test('T piece ชิดกำแพงซ้าย แล้วหมุน -> kick ไปทางขวาได้สำเร็จ (x เปลี่ยน)', () => {
    // T rotation 1 (ตะแคงชี้ขวา) ที่ x=-1: บล็อกซ้ายสุดของ shape rotation 2 จะหลุดขอบซ้าย
    // ต้อง kick ด้วย offset [1, 0] ถึงจะวางได้
    const engine = new TetrisEngine();
    engine.setActivePiece(createTestPiece('T', -1, 5, 1));

    const result = engine.rotate();

    expect(result.success).toBe(true);
    const snapshot = engine.getRenderSnapshot();
    expect(snapshot.activePiece.rotation).toBe(2);
    expect(snapshot.activePiece.position.x).toBe(0);
    expect(snapshot.activePiece.position.y).toBe(5);
  });

  test('I piece ชิดกำแพง แล้วหมุน ใช้ offset ชุด I (ค่าต่างจาก JLSTZ) และหมุนสำเร็จ', () => {
    // I piece rotation 0 ที่ x=8 ชิดขอบขวา: JLSTZ จะ kick แค่ 1 ช่อง แต่ I piece ต้อง kick
    // ถึง 2 ช่อง (offset [-2, 0]) ถึงจะวางได้ — ยืนยันว่าใช้ตาราง I_KICKS ไม่ใช่ JLSTZ_KICKS
    const engine = new TetrisEngine();
    engine.setActivePiece(createTestPiece('I', 8, 5, 0));

    const result = engine.rotate();

    expect(result.success).toBe(true);
    const snapshot = engine.getRenderSnapshot();
    expect(snapshot.activePiece.rotation).toBe(1);
    expect(snapshot.activePiece.position.x).toBe(6);
    expect(snapshot.activePiece.position.y).toBe(5);

    // ตรวจสอบตรงๆ ว่าตาราง I piece ต่างจาก JLSTZ ที่ rotation state เดียวกัน
    const iOffsets = getWallKickOffsets('I', 0);
    const jlstzOffsets = getWallKickOffsets('T', 0);
    expect(iOffsets).not.toEqual(jlstzOffsets);
  });

  test('O piece หมุนที่ไหนก็ได้ ตำแหน่งไม่ขยับเลย (offset [0,0] เสมอ)', () => {
    const engine = new TetrisEngine();
    engine.setActivePiece(createTestPiece('O', 4, 5, 0));

    for (let i = 0; i < 4; i++) {
      const result = engine.rotate();
      expect(result.success).toBe(true);
      const snapshot = engine.getRenderSnapshot();
      expect(snapshot.activePiece.position.x).toBe(4);
      expect(snapshot.activePiece.position.y).toBe(5);
    }

    // ทุก rotation state ของ O piece ต้องมีแค่ offset [0, 0] เท่านั้น
    for (const rotation of [0, 1, 2, 3] as const) {
      expect(getWallKickOffsets('O', rotation)).toEqual([[0, 0]]);
    }
  });

  test('หมุนในช่องแคบที่ทุก offset ชนหมด (หลุมกว้าง 1 คอลัมน์) -> success: false และไม่เปลี่ยนตำแหน่ง/rotation', () => {
    // เตรียม I piece rotation 1 (แนวตั้ง เต็มคอลัมน์เดียว) ให้วางพอดีในหลุมคอลัมน์ 4
    // (shape rotation 1 ของ I piece ครอบครองแค่ col index 2 ในกริด 4x4 -> position.x = 2)
    const board = createNarrowWellBoard(4);
    const engine = new TetrisEngine();
    engine.setBoard(board);
    engine.setActivePiece(createTestPiece('I', 2, 5, 1));

    const beforeSnapshot = engine.getRenderSnapshot();
    const result = engine.rotate();

    expect(result.success).toBe(false);
    const afterSnapshot = engine.getRenderSnapshot();
    expect(afterSnapshot.activePiece.position.x).toBe(beforeSnapshot.activePiece.position.x);
    expect(afterSnapshot.activePiece.position.y).toBe(beforeSnapshot.activePiece.position.y);
    expect(afterSnapshot.activePiece.rotation).toBe(beforeSnapshot.activePiece.rotation);
  });

  test('หมุนใกล้พื้น (floor-kick กรณีเดิม) ยังทำงานถูกต้องผ่านตาราง kick offset ที่มี dy แนวตั้ง', () => {
    const engine = new TetrisEngine();
    engine.setActivePiece(createTestPiece('T', 4, 18, 0));

    const result = engine.rotate();

    expect(result.success).toBe(true);
    const snapshot = engine.getRenderSnapshot();
    expect(snapshot.activePiece.rotation).toBe(1);
    // offset ที่ใช้จริงคือ [-1, -1] (ลำดับที่ 3 ของ JLSTZ_KICKS fromRotation=0)
    expect(snapshot.activePiece.position.x).toBe(3);
    expect(snapshot.activePiece.position.y).toBe(17);
  });

  test('หมุนในสถานะ y < 0 (buffer zone) ที่ต้อง kick แนวตั้งด้วย ต้องผ่านโดยไม่ชนเพดาน', () => {
    // วางบล็อกกีดขวางที่ (5, 0) เพื่อบังคับให้ offset [0,0] และ [-1,0] ชนกัน
    // offset ที่ใช้ได้จริงคือ [-1,-1] ซึ่งพา piece ลอยขึ้นไปอยู่ที่ y=-2 (ยังอยู่เหนือกระดาน)
    // ต้องไม่ถูกนับเป็นการชนเพดาน เพราะ checkCollision อนุญาต buffer zone (y < 0) เสมอ
    const engine = new TetrisEngine();
    const board = setCell(createEmptyBoard(), 5, 0, 'Z');
    engine.setBoard(board);
    engine.setActivePiece(createTestPiece('T', 4, -1, 0));

    const result = engine.rotate();

    expect(result.success).toBe(true);
    const snapshot = engine.getRenderSnapshot();
    expect(snapshot.activePiece.rotation).toBe(1);
    expect(snapshot.activePiece.position.x).toBe(3);
    expect(snapshot.activePiece.position.y).toBe(-2);
  });

  test('หมุนติดกันหลายครั้ง (0→1→2→3→0) กลางกระดานว่าง กลับมาตำแหน่ง/shape ตรงกับตอนเริ่ม (round-trip)', () => {
    const engine = new TetrisEngine();
    engine.setActivePiece(createTestPiece('T', 4, 5, 0));

    for (let i = 0; i < 4; i++) {
      const result = engine.rotate();
      expect(result.success).toBe(true);
    }

    const snapshot = engine.getRenderSnapshot();
    expect(snapshot.activePiece.rotation).toBe(0);
    expect(snapshot.activePiece.position.x).toBe(4);
    expect(snapshot.activePiece.position.y).toBe(5);
  });

  describe('Pure function guarantee ของ getWallKickOffsets()', () => {
    test('เรียกซ้ำด้วย input เดิมได้ผลลัพธ์เดิมเสมอ (deterministic, ไม่มี state ค้าง)', () => {
      const first = getWallKickOffsets('T', 0);
      const second = getWallKickOffsets('T', 0);
      expect(first).toEqual(second);

      const firstI = getWallKickOffsets('I', 2);
      const secondI = getWallKickOffsets('I', 2);
      expect(firstI).toEqual(secondI);
    });

    test('ค่าที่คืนมาไม่ถูก mutate ระหว่างการเรียกใช้งานหลายครั้ง', () => {
      const offsets = getWallKickOffsets('T', 0);
      const snapshotBefore = JSON.parse(JSON.stringify(offsets));

      // เรียกซ้ำหลายครั้งและเรียก type/rotation อื่นแทรก เพื่อยืนยันว่าไม่มี shared mutable state
      getWallKickOffsets('I', 1);
      getWallKickOffsets('O', 3);
      getWallKickOffsets('T', 0);

      expect(getWallKickOffsets('T', 0)).toEqual(snapshotBefore);
    });
  });
});
