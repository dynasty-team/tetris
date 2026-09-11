// 01-Source-code/core-engine/TetrisEngine.ts
import type {
  CoreEngine,
  Board,
  ActivePiece,
  ActionResult,
  RenderSnapshot,
  TetrominoType,
  GameStatus,
  Position,
} from '../shared/types';
import { createEmptyBoard } from '../shared/board-utils';
import { checkCollision } from './collision';
import { getShape } from './tetromino-shapes';
import { SevenBagRandomizer } from './randomizer';

/** ตำแหน่งเริ่มต้น (Bounding box top-left) มาตรฐานสำหรับ spawn piece (SRS) */
export const DEFAULT_SPAWN_POSITION: Readonly<Position> = { x: 3, y: 0 };

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
  private randomizer: SevenBagRandomizer;

  /**
   * @param randomizer ตัวสุ่ม 7-bag randomizer (สามารถส่ง mock/custom shuffle เข้ามาทดสอบได้)
   * @param initialBoard กระดานเริ่มต้น (ถ้าไม่ระบุจะเป็น empty board 10x20)
   */
  constructor(randomizer?: SevenBagRandomizer, initialBoard?: Board) {
    this.board = initialBoard ? initialBoard.map((row) => [...row]) : createEmptyBoard();
    this.activePiece = null;
    this.score = 0;
    this.level = 1;
    this.linesClearedTotal = 0;
    this.gameOver = false;
    this.isLocking = false;
    this.randomizer = randomizer ?? new SevenBagRandomizer();
    // ดึง piece เตรียมไว้ใน nextPiece ล่วงหน้าสำหรับ Next preview
    this.nextPiece = this.randomizer.next();
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
   * สุ่ม/ดึง piece ชิ้นถัดไปเข้ามาเป็น active piece ที่ตำแหน่งเริ่มต้นด้านบนกระดาน
   * หากเกิดการชนทันที (มีบล็อกกองถึงจุด spawn) = จบเกม (gameOver: true)
   */
  public spawnNextPiece(): ActionResult {
    if (this.gameOver) {
      return {
        success: false,
        linesCleared: [],
        gameOver: true,
      };
    }

    // นำชิ้นส่วนที่เตรียมไว้ใน nextPiece มาเกิด หากไม่มีให้ดึงจากถุง
    const pieceType: TetrominoType = this.nextPiece ?? this.randomizer.next();
    // สุ่มชิ้นถัดไปเข้าคิว nextPiece เสมอ
    this.nextPiece = this.randomizer.next();

    const newPiece: ActivePiece = {
      type: pieceType,
      position: { ...DEFAULT_SPAWN_POSITION },
      rotation: 0,
      shape: getShape(pieceType, 0),
    };

    // ตรวจสอบการชนกับบล็อกเดิมบนกระดานตั้งแต่จุดเกิด (Lock out / Block out)
    const hasCollision = checkCollision(this.board, newPiece);

    if (hasCollision) {
      this.gameOver = true;
      this.activePiece = newPiece;
      return {
        success: false,
        linesCleared: [],
        gameOver: true,
      };
    }

    this.activePiece = newPiece;
    this.isLocking = false;

    return {
      success: true,
      linesCleared: [],
      gameOver: false,
    };
  }

  /**
   * กำหนดกระดานใหม่ (ใช้สำหรับ Testing และ State restoration)
   */
  public setBoard(board: Board): void {
    this.board = board.map((row) => [...row]);
  }

  /**
   * ดึงสำเนากระดานปัจจุบัน
   */
  public getBoard(): Board {
    return this.board.map((row) => [...row]);
  }

  /**
   * ดึงสำเนา active piece ปัจจุบัน (null หากยังไม่ spawn)
   */
  public getActivePiece(): ActivePiece | null {
    if (!this.activePiece) return null;
    return {
      ...this.activePiece,
      position: { ...this.activePiece.position },
      shape: this.activePiece.shape.map((row) => [...row]),
    };
  }

  /**
   * ดึงชิ้นส่วนถัดไปในคิว
   */
  public getNextPiece(): TetrominoType | null {
    return this.nextPiece;
  }

  /**
   * ดึง 7-bag randomizer ประจำ engine
   */
  public getRandomizer(): SevenBagRandomizer {
    return this.randomizer;
  }

  /**
   * คืน snapshot สำหรับนำไป render บนหน้าจอ
   */
  public getRenderSnapshot(): RenderSnapshot {
    const status: GameStatus = this.gameOver ? 'gameover' : 'playing';

    return {
      board: this.board.map((row) => [...row]),
      activePiece: this.activePiece ?? {
        type: this.nextPiece ?? 'T',
        position: { ...DEFAULT_SPAWN_POSITION },
        rotation: 0,
        shape: getShape(this.nextPiece ?? 'T', 0),
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

/**
 * ฟังก์ชัน helper spawnNextPiece แบบ standalone สำหรับกรณีเรียกใช้งานแบบฟังก์ชันเดี่ยว
 *
 * @param engine TetrisEngine instance (หากไม่ส่งเข้ามา จะสร้าง engine ใหม่ขึ้นมารองรับ)
 * @returns ActionResult
 */
export function spawnNextPiece(engine?: TetrisEngine): ActionResult {
  const targetEngine = engine ?? new TetrisEngine();
  return targetEngine.spawnNextPiece();
}
