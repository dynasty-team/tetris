// 01-Source-code/shared/board-utils.ts
//
// Helper กลางสำหรับเข้าถึง Board — จำเป็นเพราะ tsconfig.json ของ repo นี้ตั้ง
// noUncheckedIndexedAccess: true ไว้แล้ว การ index board[y][x] ตรงๆ จะได้ type
// `CellValue | undefined` เสมอ ทุกทีมต้องเรียกฟังก์ชันเหล่านี้แทนการ index เอง
// (โดยเฉพาะ io-rendering ตอน render board)

import type { Board, CellValue } from './types';
import { BOARD_WIDTH, BOARD_HEIGHT } from './constants';

/** สร้าง board เปล่าขนาด 10x20 เต็มไปด้วยค่า 0 (ว่าง) */
export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () =>
    Array<CellValue>(BOARD_WIDTH).fill(0),
  );
}

/**
 * อ่านค่า cell อย่างปลอดภัย — นอกขอบ board ถือว่า 0 (ว่าง)
 * ปกติควรเช็ค bound ก่อนเรียกอยู่แล้ว แต่ฟังก์ชันนี้กันพลาดอีกชั้น
 */
export function getCell(board: Board, x: number, y: number): CellValue {
  return board[y]?.[x] ?? 0;
}

/**
 * คืน board ใหม่ที่เปลี่ยนค่า cell ตำแหน่ง (x, y) เป็น value
 * เป็น pure function — ไม่ mutate board เดิม (ตาม FP requirement)
 */
export function setCell(board: Board, x: number, y: number, value: CellValue): Board {
  return board.map((row, rowIndex) =>
    rowIndex === y
      ? row.map((cell, colIndex) => (colIndex === x ? value : cell))
      : row,
  );
}

/** เช็คว่าตำแหน่ง (x, y) อยู่ในขอบ board ไหม */
export function isInBounds(x: number, y: number): boolean {
  return x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT;
}
