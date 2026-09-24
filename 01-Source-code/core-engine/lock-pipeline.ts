import { checkAndClearLines } from './line-clear';
import { lockPieceToBoard, type MovementState } from './movement';
import { pipe } from '../shared/utils';
import type { ActivePiece } from '../shared/types';

/** ชิ้นส่วนที่ boundary เตรียมไว้ให้ pure lock pipeline */
export type NextActivePiece = ActivePiece | null;

/**
 * ขั้นตอนที่ 1: ล็อก Active Piece ลงบน Board
 * ออกแบบเป็น Pure Function โดย clone กระดานก่อนประทับชิ้นส่วน
 * และคืน State ใหม่ (Immutable) โดยไม่ mutate state ต้นฉบับ
 */
export function lockActivePieceToBoardStep<T extends MovementState = MovementState>(state: T): T {
  if (!state.activePiece) {
    return { ...state };
  }

  const newBoard = lockPieceToBoard(state.board, state.activePiece);

  return {
    ...state,
    board: newBoard,
    activePiece: null,
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
 * ขั้นตอนที่ 3: ใส่ชิ้นส่วนถัดไปที่ถูกสร้างจากภายนอกแล้ว
 * ฟังก์ชันนี้ไม่สุ่มและไม่เรียก callback จึงเป็น pure function
 */
export function spawnNextPieceStep<T extends MovementState = MovementState>(
  state: T,
  nextActivePiece: NextActivePiece = null,
): T {
  return {
    ...state,
    activePiece: nextActivePiece,
  };
}

/**
 * ประกอบ 3 ขั้นตอนเข้าด้วยกันผ่าน Higher-order Function: pipe()
 */
export function applyLock<T extends MovementState = MovementState>(
  state: T,
  nextActivePiece: NextActivePiece = null,
): T {
  const applyCoreSteps = pipe(
    lockActivePieceToBoardStep<T>,
    clearFullLinesStep<T>,
    (nextState: T) => spawnNextPieceStep(nextState, nextActivePiece),
  );

  return applyCoreSteps(state);
}

