// 01-Source-code/core-engine/TetrisEngine.ts
import type {
  CoreEngine,
  Board,
  ActivePiece,
  ActionResult,
  RenderSnapshot,
  TetrominoType,
  GameStatus,
} from '../shared/types';
import { createEmptyBoard } from '../shared/board-utils';
import { checkCollision } from './collision';
import { getShape } from './tetromino-shapes';
import {
  moveLeft,
  moveRight,
  softDrop,
  rotate,
  hardDrop,
  performLock,
  isPieceOnGround,
  startLockTimer,
  cancelLockTimer,
  type MovementState,
} from './movement';

/**
 * คลาสหลัก TetrisEngine ควบคุม Game State และ Logic ของเกม Tetris
 * ทำตาม CoreEngine interface ตามข้อกำหนดเชิงสถาปัตยกรรม (OOP)
 */
export class TetrisEngine implements CoreEngine, MovementState {
  public board: Board;
  public activePiece: ActivePiece | null;
  public score: number;
  public level: number;
  public linesClearedTotal: number;
  public nextPiece: TetrominoType | null;
  public gameOver: boolean;
  public isLocking: boolean;
  public lockResets: number;
  public lockTimer: ReturnType<typeof setTimeout> | null;

  constructor() {
    this.board = createEmptyBoard();
    this.activePiece = null;
    this.score = 0;
    this.level = 1;
    this.linesClearedTotal = 0;
    this.nextPiece = 'I';
    this.gameOver = false;
    this.isLocking = false;
    this.lockResets = 0;
    this.lockTimer = null;

    // เริ่มต้นเกมด้วยการ spawn ชิ้นส่วนแรก
    this.spawnNextPiece();
  }
  [key: string]: unknown;

  /**
   * ขยับ active piece ไปทางซ้าย 1 ช่อง
   */
  public moveLeft(): ActionResult {
    return moveLeft(this);
  }

  /**
   * ขยับ active piece ไปทางขวา 1 ช่อง
   */
  public moveRight(): ActionResult {
    return moveRight(this);
  }

  /**
   * เลื่อน active piece ลง 1 ช่อง (Soft Drop)
   */
  public softDrop(): ActionResult {
    return softDrop(this);
  }

  /**
   * หมุน active piece (หมุนตามเข็มนาฬิกา / Wall Kick)
   */
  public rotate(): ActionResult {
    return rotate(this);
  }

  /**
   * ทิ้ง active piece ลงพื้นทันทีและ lock ติด board (Hard Drop)
   */
  public hardDrop(): ActionResult {
    return hardDrop(this);
  }

  /**
   * เรียกตาม interval ของ gravity เพื่อให้ piece เลื่อนลงอัตโนมัติ
   */
  public tick(): ActionResult {
    if (this.gameOver) {
      return {
        success: false,
        linesCleared: [],
        gameOver: true,
      };
    }

    if (!this.activePiece) {
      return this.spawnNextPiece();
    }

    return this.softDrop();
  }

  /**
   * ล็อก active piece ลงบนกระดาน และเรียก spawnNextPiece
   */
  public lockPiece(): ActionResult {
    return performLock(this);
  }

  /**
   * สุ่ม/ดึง piece ชิ้นถัดไปเข้ามาเป็น active piece (C5)
   */
  public spawnNextPiece(): ActionResult {
    if (this.gameOver) {
      return {
        success: false,
        linesCleared: [],
        gameOver: true,
      };
    }

    cancelLockTimer(this);

    const typeToSpawn: TetrominoType = this.nextPiece ?? 'T';

    // เตรียม preview ชิ้นถัดไป
    const pieceTypes: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    const currentIndex = pieceTypes.indexOf(typeToSpawn);
    this.nextPiece = pieceTypes[(currentIndex + 1) % pieceTypes.length] ?? 'I';

    const spawnPiece: ActivePiece = {
      type: typeToSpawn,
      position: { x: 3, y: 0 },
      rotation: 0,
      shape: getShape(typeToSpawn, 0),
    };

    // ตรวจจับการชนตั้งแต่เกิด (Game Over / Top-out)
    if (checkCollision(this.board, spawnPiece)) {
      this.activePiece = spawnPiece;
      this.gameOver = true;
      return {
        success: false,
        linesCleared: [],
        gameOver: true,
      };
    }

    this.activePiece = spawnPiece;
    this.isLocking = isPieceOnGround(this.board, spawnPiece);
    if (this.isLocking) {
      startLockTimer(this);
    }

    return {
      success: true,
      linesCleared: [],
      gameOver: false,
    };
  }

  /**
   * คืน snapshot สำหรับนำไป render บนหน้าจอ
   */
  public getRenderSnapshot(): RenderSnapshot {
    const status: GameStatus = this.gameOver ? 'gameover' : 'playing';

    return {
      board: this.board.map((row) => [...row]),
      activePiece: this.activePiece ?? {
        type: 'T',
        position: { x: 3, y: 0 },
        rotation: 0,
        shape: getShape('T', 0),
      },
      nextPiece: this.nextPiece ?? 'I',
      score: this.score,
      level: this.level,
      linesClearedTotal: this.linesClearedTotal,
      status,
      isLocking: this.isLocking,
    };
  }

  /**
   * คืนคะแนนปัจจุบัน
   */
  public getScore(): number {
    return this.score;
  }

  /**
   * คืนระดับเลเวลปัจจุบัน
   */
  public getLevel(): number {
    return this.level;
  }

  /**
   * ตรวจสอบว่าสถานะเกมจบลงแล้วหรือไม่
   */
  public isGameOver(): boolean {
    return this.gameOver;
  }

  /**
   * Helper สำหรับตั้งค่า activePiece โดยตรง (สำหรับ Unit Test)
   */
  public setActivePiece(piece: ActivePiece | null): void {
    cancelLockTimer(this);
    this.activePiece = piece;
    if (piece && isPieceOnGround(this.board, piece)) {
      startLockTimer(this);
    }
  }

  /**
   * Helper สำหรับตั้งค่า board โดยตรง (สำหรับ Unit Test)
   */
  public setBoard(board: Board): void {
    this.board = board;
  }
}
