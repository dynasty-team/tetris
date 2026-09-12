import { checkAndClearLines } from './line-clear';
import { lockPieceToBoard, type MovementState } from './movement'
import { pipe } from '../shared/utils';

export function lockActivePieceToBoardStep<T extends MovementState = MovementState>(state: T): T {
  if (state.activePiece) {
    lockPieceToBoard(state.board, state.activePiece); // ใช้ของเดิม ไม่แก้
    state.activePiece = null;
  }
  return state;
}

export function clearFullLinesStep<T extends MovementState = MovementState>(state: T): T {
  const { newBoard, linesCleared, clearedLines } = checkAndClearLines(state.board);
  state.board = newBoard;
  state.linesClearedTotal = (state.linesClearedTotal ?? 0) + linesCleared;
  state.lastClearedLines = clearedLines; // ต้องเพิ่ม field นี้ใน MovementState (ดูข้อ 2)
  return state;
}

export function spawnNextPieceStep<T extends MovementState = MovementState>(state: T): T {
  state.spawnNextPiece?.();
  return state;
}

export const applyLock = pipe(
  lockActivePieceToBoardStep,
  clearFullLinesStep,
  spawnNextPieceStep,
);
