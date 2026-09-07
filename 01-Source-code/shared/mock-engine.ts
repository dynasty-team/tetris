// 01-Source-code/shared/mock-engine.ts
//
// ทีม io-rendering / game-state-loop ใช้ mock นี้พัฒนาคู่ขนานได้เลยตั้งแต่สัปดาห์ 2
// โดยไม่ต้องรอ core-engine เขียน logic จริงเสร็จ 100% ก่อน
// พอ core-engine ของจริงเสร็จ ให้สลับ import เฉยๆ (เพราะ signature เหมือนกันทุกอย่าง)
//
// ข้อตกลง: ทีมไหนใช้ mock นี้เขียน test ไว้ก่อน ต้องมาเปลี่ยนเป็น core-engine จริง
// และรัน integration test ซ้ำ ก่อนจบสัปดาห์ 3

import type { RenderSnapshot, ActionResult } from './types';

export const mockRenderSnapshot: RenderSnapshot = {
  board: Array.from({ length: 20 }, () => Array(10).fill(0)),
  activePiece: {
    type: 'T',
    position: { x: 4, y: 0 },
    rotation: 0,
    shape: [
      [0, 1, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  },
  nextPiece: 'I',
  score: 0,
  level: 1,
  linesClearedTotal: 0,
  status: 'playing',
  isLocking: false,
};

/** mock ActionResult ครบทุกเคสที่ game-state-loop ต้องจัดการ */

/** เคสปกติ: ขยับ/หมุนสำเร็จ ไม่มีอะไรพิเศษเกิดขึ้น */
export const mockActionResult_success: ActionResult = {
  success: true,
  linesCleared: [],
  gameOver: false,
};

/** เคสถูกบล็อก: เช่น เรียก moveLeft() แล้วชนขอบ/บล็อกอื่น */
export const mockActionResult_blocked: ActionResult = {
  success: false,
  linesCleared: [],
  gameOver: false,
};

/** เคสเคลียร์ 4 แถวพร้อมกัน (Tetris) — ใช้เทสสูตรคะแนนใน S1 */
export const mockActionResult_tetris: ActionResult = {
  success: true,
  linesCleared: [16, 17, 18, 19],
  gameOver: false,
};

/** เคส spawnNextPiece ชนทันที — ใช้เทส S3 ว่า loop หยุดและ trigger save ถูกต้อง */
export const mockActionResult_gameOver: ActionResult = {
  success: false,
  linesCleared: [],
  gameOver: true,
};
