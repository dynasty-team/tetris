// 01-Source-code/core-engine/movement.ts
//
// โมดูลควบคุมการเคลื่อนที่ของชิ้นส่วน (Movement) และระบบหน่วงเวลาก่อนล็อก (Lock Delay System)
// ทำหน้าที่ตรวจสอบการชนผ่าน checkCollision (C3) ก่อนขยับจริงเสมอ
// พร้อมจัดการ Lock Delay 500ms (LOCK_DELAY_MS) และจำกัดการรีเซ็ตสูงสุด 15 ครั้ง (MAX_LOCK_RESETS)

import type { Board, ActivePiece, ActionResult, TetrominoType } from '../shared/types';
import { LOCK_DELAY_MS, MAX_LOCK_RESETS } from '../shared/constants';
import { checkCollision } from './collision';
import { rotatePiece, getShape } from './tetromino-shapes';

export { rotatePiece } from './tetromino-shapes';

/**
 * Interface สำหรับ State ที่ส่งเข้าฟังก์ชันการเคลื่อนที่
 * รองรับทั้ง Object ธรรมดาและ instance ของ TetrisEngine
 */
export interface MovementState {
  board: Board;
  activePiece: ActivePiece | null;
  isLocking: boolean;
  lockResets?: number;
  lockTimer?: ReturnType<typeof setTimeout> | null;
  gameOver?: boolean;
  nextPiece?: TetrominoType | null;
  score?: number;
  level?: number;
  linesClearedTotal?: number;
  lockPiece?: () => ActionResult | void;
  spawnNextPiece?: () => ActionResult;
  [key: string]: unknown;
}

/**
 * ผลลัพธ์จากการเคลื่อนที่ ขยายมาจาก ActionResult เพื่อส่ง state ล่าสุดกลับไปด้วย
 */
export interface MovementResult<T = MovementState> extends ActionResult {
  state?: T;
}

/**
 * ตรวจสอบว่าชิ้นส่วน activePiece แตะพื้นหรือแตะบล็อกที่วางอยู่ด้านล่างแล้วหรือไม่
 * โดยทดสอบว่าหากเลื่อนชิ้นส่วนลง 1 แถว (y + 1) จะเกิดการชนหรือไม่
 *
 * @param board กระดานเกม
 * @param piece ชิ้นส่วนที่ต้องการทดสอบ
 * @returns boolean คืนค่า true หากแตะพื้น/บล็อกด้านล่าง, false หากยังลอยอยู่
 */
export function isPieceOnGround(board: Board, piece: ActivePiece): boolean {
  const candidatePiece: ActivePiece = {
    ...piece,
    position: {
      x: piece.position.x,
      y: piece.position.y + 1,
    },
  };
  return checkCollision(board, candidatePiece);
}

/**
 * ล็อกบล็อกของ activePiece ลงบน board ถาวร
 *
 * @param board กระดานเกม
 * @param piece ชิ้นส่วนที่จะนำไปประทับลงกระดาน
 * @returns Board กระดานที่ได้รับการอัปเดตแล้ว
 */
export function lockPieceToBoard(board: Board, piece: ActivePiece): Board {
  const { shape, position, type } = piece;

  for (let r = 0; r < shape.length; r++) {
    const shapeRow = shape[r];
    if (!shapeRow) continue;

    for (let c = 0; c < shapeRow.length; c++) {
      const cell = shapeRow[c];
      if (!cell) continue;

      const boardY = position.y + r;
      const boardX = position.x + c;

      if (boardY >= 0 && boardY < board.length) {
        const targetRow = board[boardY];
        if (targetRow && boardX >= 0 && boardX < targetRow.length) {
          targetRow[boardX] = type;
        }
      }
    }
  }

  return board;
}

/**
 * ยกเลิก Lock Delay Timer และตั้งค่า isLocking = false
 */
export function cancelLockTimer(state: MovementState): void {
  if (state.lockTimer) {
    clearTimeout(state.lockTimer);
    state.lockTimer = null;
  }
  state.isLocking = false;
}

/**
 * เริ่มนับเวลา Lock Delay Timer ใหม่ (500ms)
 */
export function startLockTimer(state: MovementState, onTimeout?: () => void): void {
  cancelLockTimer(state);
  state.isLocking = true;
  state.lockResets = state.lockResets ?? 0;

  state.lockTimer = setTimeout(() => {
    performLock(state);
    if (onTimeout) {
      onTimeout();
    }
  }, LOCK_DELAY_MS);
}

/**
 * รีเซ็ต Lock Delay Timer เดิมและเริ่มนับ 500ms ใหม่
 */
export function restartLockTimer(state: MovementState, onTimeout?: () => void): void {
  if (state.lockTimer) {
    clearTimeout(state.lockTimer);
    state.lockTimer = null;
  }
  state.isLocking = true;

  state.lockTimer = setTimeout(() => {
    performLock(state);
    if (onTimeout) {
      onTimeout();
    }
  }, LOCK_DELAY_MS);
}

/**
 * สั่งให้ล็อกชิ้นส่วนลงบน board ทันที เคลียร์สถานะ lock delay และเรียก spawn ชิ้นส่วนใหม่ (C5)
 */
export function performLock(state: MovementState): ActionResult {
  cancelLockTimer(state);
  state.lockResets = 0;
  state.isLocking = false;

  if (state.activePiece) {
    lockPieceToBoard(state.board, state.activePiece);
    state.activePiece = null;

    if (typeof state.spawnNextPiece === 'function') {
      return state.spawnNextPiece();
    }
  }

  return {
    success: true,
    linesCleared: [],
    gameOver: state.gameOver ?? false,
  };
}

/**
 * จัดการตรรกะ Lock Delay เมื่อชิ้นส่วนเกิดการเคลื่อนที่หรือหมุนสำเร็จ
 * 1. ถ้าแตะพื้น:
 *    - หากอยู่ใน lock delay อยู่แล้ว -> นับจำนวน reset เพิ่ม
 *      - ถ้าถึง MAX_LOCK_RESETS (15) -> lock ทันที
 *      - ถ้ารีเซ็ตยังไม่ถึง 15 -> รีเซ็ตเวลานับ 500ms ใหม่
 *    - หากยังไม่อยู่ใน lock delay -> เริ่มจับเวลา 500ms
 * 2. ถ้าไม่แตะพื้น (เช่น เลื่อนออกจากขอบชานชาลาลงสู่ที่ว่าง):
 *    - ยกเลิก timer และปลดสถานะ isLocking
 */
export function handleLockDelayOnMove(state: MovementState): void {
  if (!state.activePiece) return;

  const onGround = isPieceOnGround(state.board, state.activePiece);

  if (onGround) {
    if (state.isLocking) {
      const nextResets = (state.lockResets ?? 0) + 1;
      state.lockResets = nextResets;

      if (nextResets >= MAX_LOCK_RESETS) {
        // ขยับ/หมุนสะสมถึง MAX_LOCK_RESETS (15 ครั้ง) -> ล็อกทันที
        performLock(state);
      } else {
        // รีเซ็ตเวลานับ 500ms ใหม่
        restartLockTimer(state);
      }
    } else {
      // เพิ่งแตะพื้นครั้งแรก -> เริ่ม lock delay
      startLockTimer(state);
    }
  } else {
    // ลอยอยู่ในอากาศ ไม่แตะพื้น -> ปลดสถานะ lock delay
    cancelLockTimer(state);
  }
}

/**
 * ขยับ active piece ไปทางซ้าย 1 ช่อง
 * เรียก checkCollision (C3) ก่อนขยับจริงเสมอ
 */
export function moveLeft<T extends MovementState = MovementState>(state: T): MovementResult<T> {
  if (state.gameOver || !state.activePiece) {
    return {
      success: false,
      linesCleared: [],
      gameOver: state.gameOver ?? false,
      state,
    };
  }

  const currentPiece = state.activePiece;
  const candidatePiece: ActivePiece = {
    ...currentPiece,
    position: {
      x: currentPiece.position.x - 1,
      y: currentPiece.position.y,
    },
    shape: currentPiece.shape.map((row) => [...row]),
  };

  if (checkCollision(state.board, candidatePiece)) {
    return {
      success: false,
      linesCleared: [],
      gameOver: state.gameOver ?? false,
      state,
    };
  }

  // ขยับสำเร็จ
  state.activePiece = candidatePiece;
  handleLockDelayOnMove(state);

  return {
    success: true,
    linesCleared: [],
    gameOver: state.gameOver ?? false,
    state,
  };
}

/**
 * ขยับ active piece ไปทางขวา 1 ช่อง
 * เรียก checkCollision (C3) ก่อนขยับจริงเสมอ
 */
export function moveRight<T extends MovementState = MovementState>(state: T): MovementResult<T> {
  if (state.gameOver || !state.activePiece) {
    return {
      success: false,
      linesCleared: [],
      gameOver: state.gameOver ?? false,
      state,
    };
  }

  const currentPiece = state.activePiece;
  const candidatePiece: ActivePiece = {
    ...currentPiece,
    position: {
      x: currentPiece.position.x + 1,
      y: currentPiece.position.y,
    },
    shape: currentPiece.shape.map((row) => [...row]),
  };

  if (checkCollision(state.board, candidatePiece)) {
    return {
      success: false,
      linesCleared: [],
      gameOver: state.gameOver ?? false,
      state,
    };
  }

  // ขยับสำเร็จ
  state.activePiece = candidatePiece;
  handleLockDelayOnMove(state);

  return {
    success: true,
    linesCleared: [],
    gameOver: state.gameOver ?? false,
    state,
  };
}

/**
 * ขยับ active piece ลงล่าง 1 ช่อง (Soft Drop)
 * เรียก checkCollision (C3) ก่อนขยับจริงเสมอ
 */
export function softDrop<T extends MovementState = MovementState>(state: T): MovementResult<T> {
  if (state.gameOver || !state.activePiece) {
    return {
      success: false,
      linesCleared: [],
      gameOver: state.gameOver ?? false,
      state,
    };
  }

  const currentPiece = state.activePiece;
  const candidatePiece: ActivePiece = {
    ...currentPiece,
    position: {
      x: currentPiece.position.x,
      y: currentPiece.position.y + 1,
    },
    shape: currentPiece.shape.map((row) => [...row]),
  };

  if (checkCollision(state.board, candidatePiece)) {
    // ขยับลงไม่ได้ ชนพื้น/บล็อก -> เริ่ม lock delay หากยังไม่ได้เริ่ม
    if (!state.isLocking) {
      startLockTimer(state);
    }
    return {
      success: false,
      linesCleared: [],
      gameOver: state.gameOver ?? false,
      state,
    };
  }

  // ขยับสำเร็จ
  state.activePiece = candidatePiece;

  // ตรวจสอบสถานะการแตะพื้นหลังการตกลงมา 1 ช่อง
  if (isPieceOnGround(state.board, state.activePiece)) {
    if (!state.isLocking) {
      startLockTimer(state);
    } else {
      const nextResets = (state.lockResets ?? 0) + 1;
      state.lockResets = nextResets;
      if (nextResets >= MAX_LOCK_RESETS) {
        performLock(state);
      } else {
        restartLockTimer(state);
      }
    }
  } else {
    cancelLockTimer(state);
  }

  return {
    success: true,
    linesCleared: [],
    gameOver: state.gameOver ?? false,
    state,
  };
}

/**
 * หมุน active piece ตามเข็มนาฬิกา 90 องศา
 * เรียก checkCollision (C3) ก่อนหมุนจริงเสมอ
 */
export function rotate<T extends MovementState = MovementState>(state: T): MovementResult<T> {
  if (state.gameOver || !state.activePiece) {
    return {
      success: false,
      linesCleared: [],
      gameOver: state.gameOver ?? false,
      state,
    };
  }

  const currentPiece = state.activePiece;
  let candidatePiece = rotatePiece(currentPiece);

  if (checkCollision(state.board, candidatePiece)) {
    const lowestOccupiedY = candidatePiece.shape.reduce(
      (lowestY, shapeRow, row) =>
        shapeRow.some((cell) => cell) ? Math.max(lowestY, candidatePiece.position.y + row) : lowestY,
      Number.NEGATIVE_INFINITY,
    );
    const hasNonFloorCollision = candidatePiece.shape.some((shapeRow, row) =>
      shapeRow.some((cell, col) => {
        if (!cell) return false;

        const targetX = candidatePiece.position.x + col;
        const targetY = candidatePiece.position.y + row;

        if (targetX < 0 || targetX >= state.board[0]!.length) return true;
        if (targetY < 0 || targetY >= state.board.length) return false;

        return state.board[targetY]?.[targetX] !== 0;
      }),
    );

    if (hasNonFloorCollision || lowestOccupiedY < state.board.length) {
      return {
        success: false,
        linesCleared: [],
        gameOver: state.gameOver ?? false,
        state,
      };
    }

    candidatePiece = {
      ...candidatePiece,
      position: {
        ...candidatePiece.position,
        y: candidatePiece.position.y + state.board.length - 1 - lowestOccupiedY,
      },
    };

    if (checkCollision(state.board, candidatePiece)) {
      return {
        success: false,
        linesCleared: [],
        gameOver: state.gameOver ?? false,
        state,
      };
    }
  }

  // หมุนสำเร็จ
  state.activePiece = candidatePiece;
  handleLockDelayOnMove(state);

  return {
    success: true,
    linesCleared: [],
    gameOver: state.gameOver ?? false,
    state,
  };
}

/**
 * ทิ้งชิ้นส่วนลงพื้นทันทีและล็อกติดกระดาน (Hard Drop)
 * ข้าม Lock delay ตามมาตรฐาน Tetris Guideline
 */
export function hardDrop<T extends MovementState = MovementState>(state: T): MovementResult<T> {
  if (state.gameOver || !state.activePiece) {
    return {
      success: false,
      linesCleared: [],
      gameOver: state.gameOver ?? false,
      state,
    };
  }

  // เลื่อนลงไปเรื่อยๆ จนกว่าจะชนพื้น
  while (true) {
    const candidatePiece: ActivePiece = {
      ...state.activePiece,
      position: {
        x: state.activePiece.position.x,
        y: state.activePiece.position.y + 1,
      },
      shape: state.activePiece.shape.map((row) => [...row]),
    };

    if (checkCollision(state.board, candidatePiece)) {
      break;
    }
    state.activePiece = candidatePiece;
  }

  // ล็อกติดกระดานทันที
  const lockRes = performLock(state);

  return {
    ...lockRes,
    state,
  };
}
