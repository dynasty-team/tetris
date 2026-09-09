// 01-Source-code/core-engine/collision.ts
//
// โมดูลตรวจจับการชน (Collision Detection) สำหรับ Core Engine ของ Tetris
// ทำหน้าที่เป็นเงื่อนไขความถูกต้อง (Validation Primitive) ก่อนเกิดการเปลี่ยนแปลงตำแหน่ง
// หรือการหมุนของชิ้นส่วน (ActivePiece) ทุกครั้ง เพื่อป้องกันไม่ให้ชิ้นส่วนทะลุขอบกระดาน
// หรือทับซ้อนกับบล็อกที่ถูกวางไว้แล้ว (Locked Cells)

import type { Board, ActivePiece } from '../shared/types';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../shared/constants';

/**
 * ตรวจสอบการชนของชิ้นส่วน ActivePiece กับขอบกระดานและบล็อกที่วางอยู่แล้วบนกระดาน
 *
 * หน้าที่และเหตุผลของ Logic:
 * 1. ตรวจสอบขอบกระดาน (Boundary Check):
 *    - ขอบซ้าย: x < 0
 *    - ขอบขวา: x >= 10 (BOARD_WIDTH)
 *    - ขอบล่าง (พื้น): y >= 20 (BOARD_HEIGHT)
 *    - ขอบบน (Buffer Zone): ในเกม Tetris มาตรฐาน (ตามระบบ SRS) ชิ้นส่วนที่เพิ่ง spawn
 *      หรือกระดอนจากการหมุน (Wall-Kick) สามารถลอยอยู่เหนือกระดานแถวที่ 0 (y < 0) ได้
 *      จึงไม่นับว่าชนเพดาน เว้นแต่จะออกนอกขอบซ้าย/ขวา
 *
 * 2. ตรวจสอบการทับบล็อกเดิม (Occupied Cell Check):
 *    - สำหรับบล็อกที่อยู่ในขอบเขตกระดาน (y >= 0), หากตำแหน่งบนกระดาน board[y][x] !== 0
 *      (ไม่ใช่ช่องว่าง) จะถือว่าเกิดการชนกันทันที
 *
 * 3. การนำไปใช้ร่วมกับ Wall-Kick (SRS Wall-Kick System):
 *    - เมื่อผู้เล่นหมุนชิ้นส่วนใกล้กำแพง พื้น หรือบล็อกอื่น การหมุนปกติอาจทำให้บล็อกบางส่วน
 *      ชนหรือหลุดขอบกระดาน
 *    - ระบบ Wall-kick จะคำนวณตำแหน่งทดสอบใหม่ (Candidate Piece) โดยนำ offset vector (dx, dy)
 *      มาบวกเข้ากับตำแหน่งเดิม แล้วเรียก `checkCollision(board, candidatePiece)` เพื่อทดสอบ
 *    - หากคืนค่า `false` แสดงว่าตำแหน่ง kick นั้นวางได้จริง ชิ้นส่วนจะถูกขยับไปยังตำแหน่งนั้นทันที
 *    - หากคืนค่า `true` ทุก offset test การหมุนจะล้มเหลวและรักษาตำแหน่งเดิมไว้
 *
 * @param board กระดานเกมขนาด 20 แถว x 10 คอลัมน์ (row-major: board[y][x])
 * @param piece ชิ้นส่วน Tetromino ที่ต้องการทดสอบการชน (รวมถึงตำแหน่ง x, y และ shape 4x4)
 * @returns boolean คืนค่า `true` หากชนขอบกระดานหรือทับบล็อกเดิม, คืนค่า `false` หากวางได้ปกติ
 */
export function checkCollision(board: Board, piece: ActivePiece): boolean {
  const { shape, position } = piece;

  // วนลูปตรวจสอบทุก cell ภายใน bounding box ขนาด 4x4 ของชิ้นส่วน
  for (let row = 0; row < shape.length; row++) {
    const shapeRow = shape[row];
    if (!shapeRow) continue;

    for (let col = 0; col < shapeRow.length; col++) {
      const cell = shapeRow[col];

      // หาก cell เป็น 0 หรือไม่มีบล็อก ไม่ต้องตรวจสอบการชน
      if (!cell) continue;

      const targetX = position.x + col;
      const targetY = position.y + row;

      // 1. ตรวจจับการชนขอบซ้ายหรือขอบขวา
      if (targetX < 0 || targetX >= BOARD_WIDTH) {
        return true;
      }

      // 2. ตรวจจับการชนขอบล่าง (แตะพื้นกระดานหรือหลุดลงไปด้านล่าง)
      if (targetY >= BOARD_HEIGHT) {
        return true;
      }

      // 3. ตรวจจับการชนบล็อกที่วางอยู่แล้วบนกระดาน (เมื่ออยู่ในพิกัดกระดาน y >= 0)
      // กรณี targetY < 0 ถือเป็น buffer zone เหนือกระดาน ไม่มีการชนกับบล็อกของกระดาน
      if (targetY >= 0) {
        const boardRow = board[targetY];
        const boardCell = boardRow ? boardRow[targetX] : undefined;

        // หากตำแหน่งบนกระดานไม่ใช่ช่องว่าง (CellValue !== 0) แสดงว่าเกิดการทับซ้อน
        if (boardCell !== 0 && boardCell !== undefined) {
          return true;
        }
      }
    }
  }

  // ไม่พบการชนกับขอบหรือบล็อกใดๆ วางได้อย่างถูกต้อง
  return false;
}
