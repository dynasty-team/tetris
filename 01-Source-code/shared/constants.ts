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


/** ขนาด board มาตรฐาน */
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
