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

/**
 * คลาสหลัก TetrisEngine ควบคุม Game State และ Logic ของเกม Tetris
 * ทำตาม CoreEngine interface ตามข้อกำหนดเชิงสถาปัตยกรรม (OOP)
 */
export class TetrisEngine implements CoreEngine {
  private board: Board;
  private activePiece: ActivePiece | null;
  private score: number;
  private level: number;
  private linesClearedTotal: number;
  private nextPiece: TetrominoType | null;
  private gameOver: boolean;
  private isLocking: boolean;

  constructor() {
    this.board = createEmptyBoard();
    this.activePiece = null;
    this.score = 0;
    this.level = 1;
    this.linesClearedTotal = 0;
    this.nextPiece = null;
    this.gameOver = false;
    this.isLocking = false;
  }

  /**
   * ขยับ active piece ไปทางซ้าย 1 ช่อง
   */
  public moveLeft(): ActionResult {
    // TODO: Implement move left collision check & movement logic
    return {
      success: false,
      linesCleared: [],
      gameOver: this.gameOver,
    };
  }

  /**
   * ขยับ active piece ไปทางขวา 1 ช่อง
   */
  public moveRight(): ActionResult {
    // TODO: Implement move right collision check & movement logic
    return {
      success: false,
      linesCleared: [],
      gameOver: this.gameOver,
    };
  }

  /**
   * เลื่อน active piece ลง 1 ช่อง (Soft Drop)
   */
  public softDrop(): ActionResult {
    // TODO: Implement soft drop logic & lock delay
    return {
      success: false,
      linesCleared: [],
      gameOver: this.gameOver,
    };
  }

  /**
   * หมุน active piece (หมุนตามเข็มนาฬิกา / Wall Kick)
   */
  public rotate(): ActionResult {
    // TODO: Implement rotation & wall kick logic
    return {
      success: false,
      linesCleared: [],
      gameOver: this.gameOver,
    };
  }

  /**
   * ทิ้ง active piece ลงพื้นทันทีและ lock ติด board (Hard Drop)
   */
  public hardDrop(): ActionResult {
    // TODO: Implement hard drop & immediate lock
    return {
      success: false,
      linesCleared: [],
      gameOver: this.gameOver,
    };
  }

  /**
   * เรียกตาม interval ของ gravity เพื่อให้ piece เลื่อนลงอัตโนมัติ
   */
  public tick(): ActionResult {
    // TODO: Implement tick gravity logic
    return {
      success: false,
      linesCleared: [],
      gameOver: this.gameOver,
    };
  }

  /**
   * สุ่ม/ดึง piece ชิ้นถัดไปเข้ามาเป็น active piece
   */
  public spawnNextPiece(): ActionResult {
    // TODO: Implement piece spawning via 7-bag randomizer
    return {
      success: false,
      linesCleared: [],
      gameOver: this.gameOver,
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
        position: { x: 4, y: 0 },
        rotation: 0,
        shape: [
          [0, 1, 0, 0],
          [1, 1, 1, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
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
}
