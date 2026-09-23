// 02-Tests/core-engine/tetromino-shapes.test.ts
import { describe, expect, test } from 'bun:test';
import type { TetrominoType, RotationState, ActivePiece } from '../../01-Source-code/shared/types';
import {
  TETROMINO_SHAPES,
  getShape,
  rotatePiece,
} from '../../01-Source-code/core-engine/tetromino-shapes';

describe('TETROMINO_SHAPES & Tetris Standard SRS Representation', () => {
  const allPieces: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  const allRotations: RotationState[] = [0, 1, 2, 3];

  test('ครบ 7 piece x 4 rotation = 28 shape', () => {
    expect(Object.keys(TETROMINO_SHAPES)).toHaveLength(7);

    let totalShapesCount = 0;
    for (const type of allPieces) {
      const rotations = TETROMINO_SHAPES[type];
      expect(rotations).toBeDefined();
      expect(rotations).toHaveLength(4);
      totalShapesCount += rotations.length;
    }

    expect(totalShapesCount).toBe(28);
  });

  test('ทุก shape เป็น 4x4 matrix และแต่ละ shape มี 4 บล็อก (Tetromino) เสมอ', () => {
    for (const type of allPieces) {
      for (const rot of allRotations) {
        const matrix = TETROMINO_SHAPES[type][rot];
        expect(matrix).toBeDefined();
        expect(matrix.length).toBe(4);

        let blockCount = 0;
        for (let r = 0; r < 4; r++) {
          const row = matrix[r]!;
          expect(row.length).toBe(4);
          for (let c = 0; c < 4; c++) {
            const cell = row[c]!;
            expect(cell === 0 || cell === 1).toBe(true);
            if (cell === 1) blockCount++;
          }
        }

        expect(blockCount).toBe(4);
      }
    }
  });

  test('I piece ถูกต้องตามมาตรฐาน SRS ทั้ง 4 สถานะการหมุน', () => {
    // 0: แนวนอนแถว 1
    expect(TETROMINO_SHAPES.I[0]).toEqual([
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    // 1: แนวตั้งคอลัมน์ 2
    expect(TETROMINO_SHAPES.I[1]).toEqual([
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ]);
    // 2: แนวนอนแถว 2
    expect(TETROMINO_SHAPES.I[2]).toEqual([
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
    ]);
    // 3: แนวตั้งคอลัมน์ 1
    expect(TETROMINO_SHAPES.I[3]).toEqual([
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ]);
  });

  test('O piece เป็น 2x2 คงที่เหมือนกันทุกสถานะการหมุนตามมาตรฐาน SRS', () => {
    const expectedO = [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    for (const rot of allRotations) {
      expect(TETROMINO_SHAPES.O[rot]).toEqual(expectedO);
    }
  });

  test('T piece ถูกต้องตามมาตรฐาน SRS ทั้ง 4 สถานะการหมุน', () => {
    // 0: ชี้ขึ้น
    expect(TETROMINO_SHAPES.T[0]).toEqual([
      [0, 1, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    // 1: ชี้ขวา
    expect(TETROMINO_SHAPES.T[1]).toEqual([
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ]);
    // 2: ชี้ลง
    expect(TETROMINO_SHAPES.T[2]).toEqual([
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ]);
    // 3: ชี้ซ้าย
    expect(TETROMINO_SHAPES.T[3]).toEqual([
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ]);
  });

  test('S piece ถูกต้องตามมาตรฐาน SRS ทั้ง 4 สถานะการหมุน', () => {
    // 0: แนวนอน
    expect(TETROMINO_SHAPES.S[0]).toEqual([
      [0, 1, 1, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    // 1: แนวตั้ง
    expect(TETROMINO_SHAPES.S[1]).toEqual([
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 0],
    ]);
    // 2: แนวนอน
    expect(TETROMINO_SHAPES.S[2]).toEqual([
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
    ]);
    // 3: แนวตั้ง
    expect(TETROMINO_SHAPES.S[3]).toEqual([
      [1, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ]);
  });

  test('Z piece ถูกต้องตามมาตรฐาน SRS ทั้ง 4 สถานะการหมุน', () => {
    // 0: แนวนอน
    expect(TETROMINO_SHAPES.Z[0]).toEqual([
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    // 1: แนวตั้ง
    expect(TETROMINO_SHAPES.Z[1]).toEqual([
      [0, 0, 1, 0],
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ]);
    // 2: แนวนอน
    expect(TETROMINO_SHAPES.Z[2]).toEqual([
      [0, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ]);
    // 3: แนวตั้ง
    expect(TETROMINO_SHAPES.Z[3]).toEqual([
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [1, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
  });

  test('J piece ถูกต้องตามมาตรฐาน SRS ทั้ง 4 สถานะการหมุน', () => {
    // 0: ตะขออยู่บนซ้าย
    expect(TETROMINO_SHAPES.J[0]).toEqual([
      [1, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    // 1: ตะขออยู่บนขวา
    expect(TETROMINO_SHAPES.J[1]).toEqual([
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ]);
    // 2: ตะขออยู่ล่างขวา
    expect(TETROMINO_SHAPES.J[2]).toEqual([
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 0],
    ]);
    // 3: ตะขออยู่ล่างซ้าย
    expect(TETROMINO_SHAPES.J[3]).toEqual([
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
    ]);
  });

  test('L piece ถูกต้องตามมาตรฐาน SRS ทั้ง 4 สถานะการหมุน', () => {
    // 0: ตะขออยู่บนขวา
    expect(TETROMINO_SHAPES.L[0]).toEqual([
      [0, 0, 1, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    // 1: ตะขออยู่ล่างขวา
    expect(TETROMINO_SHAPES.L[1]).toEqual([
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ]);
    // 2: ตะขออยู่ล่างซ้าย
    expect(TETROMINO_SHAPES.L[2]).toEqual([
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [1, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    // 3: ตะขออยู่บนซ้าย
    expect(TETROMINO_SHAPES.L[3]).toEqual([
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ]);
  });
});

describe('getShape()', () => {
  const allPieces: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  const allRotations: RotationState[] = [0, 1, 2, 3];

  test('คืน shape ตรงกับค่าใน TETROMINO_SHAPES ทุก piece และทุก rotation state', () => {
    for (const type of allPieces) {
      for (const rot of allRotations) {
        const shape = getShape(type, rot);
        expect(shape).toEqual(TETROMINO_SHAPES[type][rot]);
      }
    }
  });

  test('รองรับ rotation ที่เกิน 3 หรือติดลบ โดย normalize ให้อยู่ใน 0-3 เสมอ', () => {
    // rotation = 4 => 0
    expect(getShape('T', 4)).toEqual(TETROMINO_SHAPES.T[0]);
    // rotation = 5 => 1
    expect(getShape('T', 5)).toEqual(TETROMINO_SHAPES.T[1]);
    // rotation = 6 => 2
    expect(getShape('T', 6)).toEqual(TETROMINO_SHAPES.T[2]);
    // rotation = 7 => 3
    expect(getShape('T', 7)).toEqual(TETROMINO_SHAPES.T[3]);
    // rotation = -1 => 3 (270° CCW / 90° CCW)
    expect(getShape('T', -1)).toEqual(TETROMINO_SHAPES.T[3]);
    // rotation = -2 => 2
    expect(getShape('T', -2)).toEqual(TETROMINO_SHAPES.T[2]);
    // rotation = -4 => 0
    expect(getShape('T', -4)).toEqual(TETROMINO_SHAPES.T[0]);
  });

  test('เป็น pure function จริง — การแก้ไข matrix ที่คืนกลับมาไม่ส่งผลกระทบต่อ TETROMINO_SHAPES', () => {
    const shape = getShape('T', 0);
    // ทำการ mutate อาเรย์ที่ได้มา
    shape[0]![0] = 99;
    shape[1]![1] = 88;

    // ตรวจสอบว่าเรียกครั้งถัดไป ค่าต้องไม่เปลี่ยน
    const freshShape = getShape('T', 0);
    expect(freshShape[0]![0]).toBe(0);
    expect(freshShape[1]![1]).toBe(1);
    expect(TETROMINO_SHAPES.T[0][0]![0]).toBe(0);
    expect(TETROMINO_SHAPES.T[0][1]![1]).toBe(1);
  });
});

describe('rotatePiece()', () => {
  const allPieces: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

  test('หมุนตามเข็มนาฬิกา 90 องศา จาก state 0 -> 1 -> 2 -> 3 -> 0 ได้ถูกต้องทุก piece', () => {
    for (const type of allPieces) {
      let piece: ActivePiece = {
        type,
        position: { x: 3, y: 5 },
        rotation: 0,
        shape: getShape(type, 0),
      };

      // 0 -> 1
      piece = rotatePiece(piece);
      expect(piece.rotation).toBe(1);
      expect(piece.shape).toEqual(TETROMINO_SHAPES[type][1]);
      expect(piece.position).toEqual({ x: 3, y: 5 });

      // 1 -> 2
      piece = rotatePiece(piece);
      expect(piece.rotation).toBe(2);
      expect(piece.shape).toEqual(TETROMINO_SHAPES[type][2]);

      // 2 -> 3
      piece = rotatePiece(piece);
      expect(piece.rotation).toBe(3);
      expect(piece.shape).toEqual(TETROMINO_SHAPES[type][3]);

      // 3 -> 0 (วนกลับมารอบเดิม)
      piece = rotatePiece(piece);
      expect(piece.rotation).toBe(0);
      expect(piece.shape).toEqual(TETROMINO_SHAPES[type][0]);
    }
  });

  test('เป็น pure function จริง — ห้าม mutate object เดิมและ property ภายใน', () => {
    const originalPiece: ActivePiece = {
      type: 'T',
      position: { x: 4, y: 1 },
      rotation: 0,
      shape: getShape('T', 0),
    };

    // เก็บ deep snapshot ก่อน rotate
    const rotationBefore = originalPiece.rotation;
    const positionBefore = { ...originalPiece.position };
    const shapeBefore = originalPiece.shape.map((row) => [...row]);

    const rotatedPiece = rotatePiece(originalPiece);

    // ตรวจสอบว่าได้ object ใหม่ (คนละ reference)
    expect(rotatedPiece).not.toBe(originalPiece);
    expect(rotatedPiece.position).not.toBe(originalPiece.position);
    expect(rotatedPiece.shape).not.toBe(originalPiece.shape);

    // ตรวจสอบว่า originalPiece ไม่ถูก mutate
    expect(originalPiece.rotation).toBe(rotationBefore);
    expect(originalPiece.position).toEqual(positionBefore);
    expect(originalPiece.shape).toEqual(shapeBefore);

    // ลอง mutate rotatedPiece แล้วตรวจสอบว่า original ไม่ได้รับผลกระทบ
    rotatedPiece.position.x = 99;
    rotatedPiece.shape[0]![0] = 77;
    expect(originalPiece.position.x).toBe(4);
    expect(originalPiece.shape[0]![0]).toBe(0);
  });
});
