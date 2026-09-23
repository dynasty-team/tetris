// 01-Source-code/core-engine/tetromino-shapes.ts
//
// ฐานข้อมูลและโมเดลรูปทรง Tetromino ทั้ง 7 ชนิดตามมาตรฐาน Tetris (SRS - Super Rotation System)
// ข้อมูลรูปร่างถูกจัดเก็บเป็น 4x4 matrix สำหรับ 4 rotation states (0, 1, 2, 3)
// ทุกฟังก์ชันเป็น Pure Function ที่ไม่มี side effect และไม่ mutate ข้อมูลเดิม

import type { TetrominoType, RotationState, ActivePiece } from '../shared/types';

/**
 * โครงสร้างข้อมูลจัดเก็บ shape 4x4 matrix ของทั้ง 7 Tetromino ชนิดละ 4 สถานะการหมุน
 * 0 = spawn (0°), 1 = 90° CW, 2 = 180°, 3 = 270° CW
 */
export const TETROMINO_SHAPES: Readonly<
  Record<TetrominoType, readonly [number[][], number[][], number[][], number[][]]>
> = {
  // I Tetromino (Cyan) - หมุนรอบจุดศูนย์กลางของกริด 4x4
  I: [
    // 0: Spawn (แถวแนวนอนที่ row 1)
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    // 1: 90° CW (แถวแนวตั้งที่ col 2)
    [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ],
    // 2: 180° (แถวแนวนอนที่ row 2)
    [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
    ],
    // 3: 270° CW (แถวแนวตั้งที่ col 1)
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ],
  ],

  // O Tetromino (Yellow) - 2x2 square ในกริด 4x4 (ทุก rotation state มีรูปร่างเหมือนกันตาม SRS)
  O: [
    // 0: Spawn
    [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    // 1: 90° CW
    [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    // 2: 180°
    [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    // 3: 270° CW
    [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  ],

  // T Tetromino (Purple) - กล่อง 3x3 บนกริด 4x4
  T: [
    // 0: Spawn (ชี้ขึ้น)
    [
      [0, 1, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    // 1: 90° CW (ชี้ขวา)
    [
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    // 2: 180° (ชี้ลง)
    [
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    // 3: 270° CW (ชี้ซ้าย)
    [
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
  ],

  // S Tetromino (Green) - กล่อง 3x3 บนกริด 4x4
  S: [
    // 0: Spawn (แนวนอน)
    [
      [0, 1, 1, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    // 1: 90° CW (แนวตั้ง)
    [
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 0],
    ],
    // 2: 180° (แนวนอน)
    [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    // 3: 270° CW (แนวตั้ง)
    [
      [1, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
  ],

  // Z Tetromino (Red) - กล่อง 3x3 บนกริด 4x4
  Z: [
    // 0: Spawn (แนวนอน)
    [
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    // 1: 90° CW (แนวตั้ง)
    [
      [0, 0, 1, 0],
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    // 2: 180° (แนวนอน)
    [
      [0, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    // 3: 270° CW (แนวตั้ง)
    [
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [1, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  ],

  // J Tetromino (Blue) - กล่อง 3x3 บนกริด 4x4
  J: [
    // 0: Spawn (หงายขึ้น, ตะขออยู่บนซ้าย)
    [
      [1, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    // 1: 90° CW (ตะขออยู่บนขวา)
    [
      [0, 1, 1, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
    // 2: 180° (คว่ำลง, ตะขออยู่ล่างขวา)
    [
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 0],
    ],
    // 3: 270° CW (ตะขออยู่ล่างซ้าย)
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [1, 1, 0, 0],
      [0, 0, 0, 0],
    ],
  ],

  // L Tetromino (Orange) - กล่อง 3x3 บนกริด 4x4
  L: [
    // 0: Spawn (หงายขึ้น, ตะขออยู่บนขวา)
    [
      [0, 0, 1, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    // 1: 90° CW (ตะขออยู่ล่างขวา)
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ],
    // 2: 180° (คว่ำลง, ตะขออยู่ล่างซ้าย)
    [
      [0, 0, 0, 0],
      [1, 1, 1, 0],
      [1, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    // 3: 270° CW (ตะขออยู่บนซ้าย)
    [
      [1, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
};

/**
 * คืนรูปทรง piece ตามชนิดและองศาที่ระบุ
 * เป็น Pure function คืน matrix ขนาด 4x4 ชุดใหม่ (deep clone) เสมอ เพื่อป้องกัน side effect
 *
 * @param type ชนิดของ Tetromino ('I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L')
 * @param rotation สถานะการหมุน (0, 1, 2, 3 หรือค่าจำนวนเต็มใดๆ โดยจะถูก normalize ให้อยู่ใน 0-3)
 * @returns 4x4 matrix ของตัวเลข (1 = มีบล็อก, 0 = ว่าง)
 */
export function getShape(type: TetrominoType, rotation: number): number[][] {
  const normalizedRotation = (((Math.floor(rotation) % 4) + 4) % 4) as RotationState;
  const shape = TETROMINO_SHAPES[type][normalizedRotation];

  // Deep clone 4x4 matrix เพื่อรับประกันความบริสุทธิ์ (Pure function)
  return shape.map((row) => [...row]);
}

/**
 * คำนวณ ActivePiece หลังหมุนตามเข็มนาฬิกา 90 องศา (Clockwise)
 * เป็น Pure function คืน object ActivePiece ใหม่ ไม่เปลี่ยนแปลง (mutate) ข้อมูลเดิม
 *
 * @param piece ข้อมูล ActivePiece ในปัจจุบัน
 * @returns ActivePiece ชิ้นใหม่ที่อัปเดต rotation และ shape แล้ว
 */
export function rotatePiece(piece: ActivePiece): ActivePiece {
  const nextRotation = ((piece.rotation + 1) % 4) as RotationState;
  const nextShape = getShape(piece.type, nextRotation);

  return {
    type: piece.type,
    position: { ...piece.position },
    rotation: nextRotation,
    shape: nextShape,
  };
}
