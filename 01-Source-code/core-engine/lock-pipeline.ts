import { checkAndClearLines } from './line-clear';
import { lockPieceToBoard, type MovementState } from './movement';
import { pipe } from '../shared/utils';

/**
 * ขั้นตอนที่ 1: ล็อก Active Piece ลงบน Board
 * ออกแบบเป็น Pure Function โดย clone กระดานก่อนประทับชิ้นส่วน
 * และคืน State ใหม่ (Immutable) โดยไม่ mutate state ต้นฉบับ
 */
export function lockActivePieceToBoardStep<T extends MovementState = MovementState>(state: T): T {
  if (!state.activePiece) {
    return {
      ...state,
      spawnNextPiece: state.spawnNextPiece,
    };
  }

  const clonedBoard = state.board.map((row) => [...row]);
  const newBoard = lockPieceToBoard(clonedBoard, state.activePiece);

  return {
    ...state,
    board: newBoard,
    activePiece: null,
    spawnNextPiece: state.spawnNextPiece,
  };
}

/**
 * ขั้นตอนที่ 2: ตรวจสอบและลบแถวที่เต็ม (Line Clear)
 * ออกแบบเป็น Pure Function รับ state เข้ามาและคืน State ใหม่ (Immutable)
 * พร้อม board ชุดใหม่, linesClearedTotal ที่เพิ่มขึ้น, และ lastClearedLines
 */
export function clearFullLinesStep<T extends MovementState = MovementState>(state: T): T {
  const { newBoard, linesCleared, clearedLines } = checkAndClearLines(state.board);
  return {
    ...state,
    board: newBoard,
    linesClearedTotal: (state.linesClearedTotal ?? 0) + linesCleared,
    lastClearedLines: clearedLines,
  };
}

/**
 * ขั้นตอนที่ 3: สุ่มเกิดชิ้นส่วนถัดไป (Spawn Next Piece)
 * จุดเชื่อมโยงกับ Side Effect ภายนอกของ Engine (Impure Boundary)
 * โดยเรียก state.spawnNextPiece?.() เพื่อเปลี่ยนผ่าน activePiece แล้วคืน state ใหม่
 */
export function spawnNextPieceStep<T extends MovementState = MovementState>(state: T): T {
  state.spawnNextPiece?.();
  return {
    ...state,
  };
}

/**
 * ประกอบ 3 ขั้นตอนเข้าด้วยกันผ่าน Higher-order Function: pipe()
 */
export const applyLock = pipe(
  lockActivePieceToBoardStep,
  clearFullLinesStep,
  spawnNextPieceStep,
);

