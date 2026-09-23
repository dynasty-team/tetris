// 01-Source-code/core-engine/line-clear.ts
//
// โมดูลสำหรับตรวจสอบและลบแถวที่เต็ม (Line Clear System)
// ออกแบบเป็น Pure Function ตามหลักการ Functional Programming (FP)
// ไม่เปลี่ยนแปลง (mutate) ข้อมูลใน Board ต้นฉบับ และคืนกระดานชุดใหม่เสมอ

import type { Board, CellValue } from '../shared/types';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../shared/constants';

/**
 * ผลลัพธ์จากการตรวจสอบและลบแถวที่เต็ม
 */
export interface LineClearResult {
  /** กระดานสถานะใหม่หลังลบแถวที่เต็มและเลื่อนแถวด้านบนลงมาแล้ว */
  newBoard: Board;
  /** จำนวนแถวที่ถูกลบ (0 - 4 แถวตามมาตรฐาน Tetris) */
  linesCleared: number;
  /** ดัชนีแถวเดิมบนกระดานที่ถูกลบ (เช่น [16, 17, 18, 19] สำหรับ Tetris) */
  clearedLines: number[];
}

/**
 * ตรวจสอบแถวที่เต็ม 10/10 ช่อง ลบแถวนั้นออก และเลื่อนแถวด้านบนลงมาแทนที่
 *
 * คุณสมบัติ:
 * 1. Pure Function: รับ board เข้ามาแล้วสร้าง board ใหม่เสมอ ไม่ mutate board เดิม
 * 2. Multi-line Clear: รองรับการลบพร้อมกันตั้งแต่ 1 ถึง 4 แถว (Single, Double, Triple, Tetris)
 * 3. Non-contiguous Clear: รองรับกรณีแถวเต็มแบบไม่ต่อเนื่องกัน (เช่น แถวที่ 15 และ 18)
 * 4. Preservation of Height: กระดานผลลัพธ์จะคงขนาด 20 แถว x 10 คอลัมน์ เสมอ
 *    โดยจะเติมแถวว่าง (ค่า 0) เข้ามาที่ด้านบนสุด (y = 0) เท่ากับจำนวนแถวที่ลบไป
 *
 * @param board กระดานเกมขนาด 20 แถว x 10 คอลัมน์ (row-major: board[y][x])
 * @returns LineClearResult ที่มี newBoard, linesCleared, และ clearedLines
 */
export function checkAndClearLines(board: Board): LineClearResult {
  const clearedLines: number[] = [];
  const remainingRows: Board = [];

  // วนลูปตรวจสอบทุกแถวจากบนลงล่าง (y: 0 ถึง 19)
  for (let y = 0; y < board.length; y++) {
    const row = board[y];
    if (!row) continue;

    // แถวเต็ม 10/10 คือทุก cell ต้องไม่ใช่ 0 (มีบล็อกครอบครองอยู่ครบทุกช่อง)
    const isRowFull = row.length === BOARD_WIDTH && row.every((cell) => cell !== 0);

    if (isRowFull) {
      clearedLines.push(y);
    } else {
      // โคลนแถวที่ไม่เต็มเพื่อป้องกันการ mutate อ้างอิงเดิม
      remainingRows.push([...row]);
    }
  }

  const linesCleared = clearedLines.length;

  // หากไม่มีแถวใดเต็มเลย คืน board ใหม่ที่ clone ไว้โดยตรง
  if (linesCleared === 0) {
    return {
      newBoard: board.map((row) => [...row]),
      linesCleared: 0,
      clearedLines: [],
    };
  }

  // สร้างแถวว่างใหม่เติมไว้ด้านบนสุด (y = 0) เท่ากับจำนวนแถวที่ลบไป เพื่อให้ความสูงคงที่เท่ากับ BOARD_HEIGHT
  const emptyRows: Board = Array.from({ length: linesCleared }, () =>
    Array<CellValue>(BOARD_WIDTH).fill(0),
  );

  const newBoard: Board = [...emptyRows, ...remainingRows];

  return {
    newBoard,
    linesCleared,
    clearedLines,
  };
}
