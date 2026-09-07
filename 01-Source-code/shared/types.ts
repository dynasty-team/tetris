// 01-Source-code/shared/types.ts
//
// สัญญากลาง (contract) ระหว่างทุกทีม — core-engine, game-state-loop, io-rendering, persistence
// ห้ามแก้ signature ที่ทีมอื่นใช้อยู่แล้วโดยไม่แจ้งใน Discord standup ก่อน (ดู CONTRIBUTING.md)
//
// หมายเหตุ tsconfig: repo นี้ตั้ง verbatimModuleSyntax: true
// เวลา import type จากไฟล์นี้ ให้ใช้ `import type { ... }` เสมอ ห้ามปนกับ import ค่าปกติ

// ---------- พื้นฐาน ----------

/** ชนิดของ Tetromino ทั้ง 7 แบบ */
export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

/** ค่าของแต่ละ cell บน board: 0 = ว่าง, อื่นๆ = ชนิดของ piece ที่ครอบครอง cell นี้ */
export type CellValue = 0 | TetrominoType;

/** Board[y][x] — ขนาด 20 แถว x 10 คอลัมน์ (row-major, y=0 คือแถวบนสุด) */
export type Board = CellValue[][];

/** ตำแหน่งอ้างอิงบน board */
export interface Position {
  /** คอลัมน์ 0-9 */
  x: number;
  /** แถว 0-19 (0 = บนสุด) */
  y: number;
}

/** สถานะการหมุน: 0=spawn, 1=90°CW, 2=180°, 3=270°CW */
export type RotationState = 0 | 1 | 2 | 3;

/** Piece ที่กำลังเล่นอยู่ ณ ขณะนี้ */
export interface ActivePiece {
  type: TetrominoType;
  /** ตำแหน่งอ้างอิง (top-left ของ bounding box 4x4) */
  position: Position;
  rotation: RotationState;
  /** 4x4 matrix, 1=มีบล็อก, 0=ไม่มี (ตาม rotation ปัจจุบัน) */
  shape: number[][];
}

// ---------- ผลลัพธ์การกระทำ ----------

/** ผลลัพธ์ทุกครั้งที่เรียก method ของ CoreEngine ที่เปลี่ยนสถานะเกม */
export interface ActionResult {
  /** การกระทำนี้ทำได้จริงไหม (เช่น ชนขอบ = false) */
  success: boolean;
  /** index แถวที่ถูกเคลียร์ (เว้นว่าง [] ถ้าไม่มี) — ใช้ทำ animation/scoring */
  linesCleared: number[];
  /** true ถ้า spawn piece ใหม่ไม่ได้ */
  gameOver: boolean;
}

// ---------- สถานะเกม ----------

export type GameStatus = 'playing' | 'paused' | 'gameover';

/**
 * Snapshot สำหรับ Rendering — io-rendering ต้องไม่แตะ internal state ของ core-engine ตรงๆ
 * ทุกครั้งที่จะ render ให้เรียก core-engine.getRenderSnapshot() แล้วใช้ค่านี้อย่างเดียว
 */
export interface RenderSnapshot {
  /** สถานะ board ปัจจุบัน (ไม่รวม active piece) */
  board: Board;
  /** piece ที่กำลังเล่นอยู่ (เอาไปวาดทับ board เอง) */
  activePiece: ActivePiece;
  /** สำหรับช่อง "Next" */
  nextPiece: TetrominoType;
  score: number;
  level: number;
  linesClearedTotal: number;
  status: GameStatus;
  /**
   * true ระหว่างช่วง lock delay (piece แตะพื้นแล้วแต่ยังขยับ/หมุนได้อยู่)
   * io-rendering ใช้ทำ visual cue ได้ (เช่น piece กระพริบ) ไม่บังคับใช้ก็ได้
   */
  isLocking: boolean;
}

// ---------- Input ----------

/**
 * ตัวกลางระหว่าง io-rendering กับ game-state-loop
 * io-rendering "แปล" raw keyboard เป็น GameAction แล้วส่งให้ game-state-loop เท่านั้น
 * io-rendering ห้ามเรียก core-engine ตรงๆ
 */
export type GameAction =
  | 'MOVE_LEFT'
  | 'MOVE_RIGHT'
  | 'SOFT_DROP'
  | 'ROTATE'
  | 'HARD_DROP'
  | 'QUIT'
  | 'PAUSE';

// ---------- Persistence ----------

export interface SaveData {
  /** เริ่มที่ 1 — เพิ่มไว้ตั้งแต่แรกกันปัญหาตอนแก้ schema ทีหลัง */
  version: number;
  highScore: number;
  level: number;
  linesCleared: number;
  /** ISO string */
  timestamp: string;
}

// ---------- Core Engine Interface ----------

/**
 * สัญญาที่ game-state-loop และ io-rendering จะอ้างอิง
 * ต้องมี class ที่ implement interface นี้จริง (ดู TetrisEngine ใน core-engine.ts)
 * ไม่ใช่แค่ export function เดี่ยวๆ กระจาย — ตาม OOP requirement ของโปรเจกต์
 */
export interface CoreEngine {
  moveLeft(): ActionResult;
  moveRight(): ActionResult;
  softDrop(): ActionResult;
  rotate(): ActionResult;
  hardDrop(): ActionResult;
  /** เรียกทุก interval ตาม speed ปัจจุบัน (gravity) */
  tick(): ActionResult;
  /** เรียกหลัง piece ก่อนหน้า lock ติด board */
  spawnNextPiece(): ActionResult;
  getRenderSnapshot(): RenderSnapshot;
  getScore(): number;
  getLevel(): number;
  isGameOver(): boolean;
}
