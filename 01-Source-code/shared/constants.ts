// 01-Source-code/shared/constants.ts
//
// ค่าคงที่มาตรฐานที่ตกลงกันไว้ล่วงหน้า — กันแต่ละทีมตีความคนละแบบ
// อ้างอิง Decision Log ในเอกสาร tetris-interface-and-issues.md ส่วนที่ 6

/**
 * เวลาหน่วง (ms) ก่อน piece ที่แตะพื้นจะ lock ติด board จริง
 * ตามมาตรฐาน Tetris Guideline — ให้ผู้เล่นแก้ตัวได้ (ขยับ/หมุนต่อ) ก่อน lock
 * ใช้กับ softDrop()/tick() เท่านั้น — hardDrop() ข้าม lock delay เสมอ
 */
export const LOCK_DELAY_MS = 500;

/**
 * จำนวนครั้งสูงสุดที่ move/rotate จะ "รีเซ็ต" lock delay ได้ต่อ 1 piece
 * (Tetris Guideline: "15-move rule") — กันผู้เล่น stall เกมไม่รู้จบ
 */
export const MAX_LOCK_RESETS = 15;

/**
 * Delayed Auto Shift (ms) — กดปุ่มค้างไว้กี่ ms ก่อนเริ่ม auto-repeat
 * ใช้กับ MOVE_LEFT / MOVE_RIGHT / SOFT_DROP เท่านั้น
 */
export const DAS_MS = 170;

/**
 * Auto Repeat Rate (ms) — หลังจาก DAS ผ่านแล้ว ขยับซ้ำทุกกี่ ms
 */
export const ARR_MS = 50;

/**
 * ขนาดถุงของ 7-bag randomizer — สับ 7 piece ในถุงแล้วหยิบทีละใบจนหมดถุงถึงสับใหม่
 * (ห้ามใช้ Math.random() ล้วนๆ เพราะจะได้ piece ซ้ำติดกันเยอะเกินไป ไม่ตรงมาตรฐาน)
 */
export const BAG_SIZE = 7;

/** ขนาด board มาตรฐาน */
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
