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
import { createEmptyBoard, validateBoard } from '../shared/board-utils';
import { checkCollision } from './collision';
import { getShape } from './tetromino-shapes';
import {
  moveLeft,
  moveRight,
  softDrop,
  rotate,
  hardDrop,
  tick,
  isPieceOnGround,
  startLockTimer,
  cancelLockTimer,
  type MovementState,
} from './movement';
import { SevenBagRandomizer } from './randomizer';

/** ตำแหน่งเริ่มต้น (Bounding box top-left) มาตรฐานสำหรับ spawn piece (SRS) */
export const DEFAULT_SPAWN_POSITION: Readonly<Position> = { x: 3, y: 0 };

/**
 * คลาสหลัก TetrisEngine ควบคุม Game State และ Logic ของเกม Tetris
 * ทำตาม CoreEngine interface ตามข้อกำหนดเชิงสถาปัตยกรรม (OOP)
 */
export class TetrisEngine implements CoreEngine {
  private readonly state: MovementState;
  private lockCallback: ((result: ActionResult) => void) | null = null;
  private boardState: Board;
  private activePieceState: ActivePiece | null;
  private score: number;
  private level: number;
  private highScore: number;
  private linesClearedTotalState: number;
  private nextPieceState: TetrominoType | null;
  private gameOverState: boolean;
  private isLockingState: boolean;
  private lockResetsState: number;
  private lockTimerState: ReturnType<typeof setTimeout> | null;
  private lastClearedLinesState: number[];
  private randomizer: SevenBagRandomizer;

  /**
   * @param randomizer ตัวสุ่ม 7-bag randomizer (สามารถส่ง mock/custom shuffle เข้ามาทดสอบได้)
   * @param initialBoard กระดานเริ่มต้น (ถ้าไม่ระบุจะเป็น empty board 10x20)
   */
  constructor(randomizer?: SevenBagRandomizer, initialBoard?: Board) {
    if (initialBoard !== undefined) {
      validateBoard(initialBoard);
      this.boardState = initialBoard.map((row) => [...row]);
    } else {
      this.boardState = createEmptyBoard();
    }
    this.activePieceState = null;
    this.score = 0;
    this.level = 1;
    this.highScore = 0;
    this.linesClearedTotalState = 0;
    this.gameOverState = false;
    this.isLockingState = false;
    this.lockResetsState = 0;
    this.lockTimerState = null;
    this.randomizer = randomizer ?? new SevenBagRandomizer();
    // ดึง piece เตรียมไว้ใน nextPiece ล่วงหน้าสำหรับ Next preview
    this.nextPieceState = this.randomizer.next();
    this.lastClearedLinesState = [];
    const engine = this;
    this.state = {
      get board() { return engine.boardState; },
      set board(board) { engine.boardState = board; },
      get activePiece() { return engine.activePieceState; },
      set activePiece(piece) { engine.activePieceState = piece; },
      get isLocking() { return engine.isLockingState; },
      set isLocking(value) { engine.isLockingState = value; },
      get lockResets() { return engine.lockResetsState; },
      set lockResets(value) { engine.lockResetsState = value ?? 0; },
      get lockTimer() { return engine.lockTimerState; },
      set lockTimer(value) { engine.lockTimerState = value ?? null; },
      get onLock() { return engine.lockCallback ?? undefined; },
      set onLock(callback) { engine.lockCallback = callback ?? null; },
      get gameOver() { return engine.gameOverState; },
      set gameOver(value) { engine.gameOverState = value ?? false; },
      get nextPiece() { return engine.nextPieceState; },
      set nextPiece(value) { engine.nextPieceState = value ?? null; },
      get linesClearedTotal() { return engine.linesClearedTotalState; },
      set linesClearedTotal(value) { engine.linesClearedTotalState = value ?? 0; },
      get lastClearedLines() { return engine.lastClearedLinesState; },
      set lastClearedLines(value) { engine.lastClearedLinesState = value ?? []; },
      spawnNextPiece: () => engine.spawnNextPiece(),
    };
  }

  /** Read-only copies/accessors for observing engine state. */
  public get board(): Board { return this.getBoard(); }
  public get activePiece(): ActivePiece | null { return this.getActivePiece(); }
  public get linesClearedTotal(): number { return this.state.linesClearedTotal ?? 0; }
  public get nextPiece(): TetrominoType | null { return this.state.nextPiece ?? null; }
  public get gameOver(): boolean { return this.state.gameOver ?? false; }
  public get isLocking(): boolean { return this.state.isLocking; }
  public get lockResets(): number { return this.state.lockResets ?? 0; }
  public get lastClearedLines(): number[] { return [...(this.state.lastClearedLines ?? [])]; }

  /**
   * ขยับ active piece ไปทางซ้าย 1 ช่อง
   */
  public moveLeft(): ActionResult {
    return moveLeft(this.state);
  }

  /**
   * ขยับ active piece ไปทางขวา 1 ช่อง
   */
  public moveRight(): ActionResult {
    return moveRight(this.state);
  }

  /**
   * เลื่อน active piece ลง 1 ช่อง (Soft Drop)
   */
  public softDrop(): ActionResult {
    return softDrop(this.state);
  }

  /**
   * หมุน active piece (หมุนตามเข็มนาฬิกา / Wall Kick)
   */
  public rotate(): ActionResult {
    return rotate(this.state);
  }

  /**
   * ทิ้ง active piece ลงพื้นทันทีและ lock ติด board (Hard Drop)
   */
  public hardDrop(): ActionResult {
    return hardDrop(this.state);
  }

  /**
   * เรียกตาม interval ของ gravity เพื่อให้ piece เลื่อนลงอัตโนมัติ
   */
  public tick(): ActionResult {
    return tick(this.state);
  }

  /**
   * สุ่ม/ดึง piece ชิ้นถัดไปเข้ามาเป็น active piece (C5)
   */
  public spawnNextPiece(): ActionResult {
    if (this.state.gameOver) {
      return {
        success: false,
        linesCleared: [],
        gameOver: true,
      };
    }

    // ตรวจสอบการชนกับบล็อกเดิมบนกระดานตั้งแต่จุดเกิด (Lock out / Block out)
    cancelLockTimer(this.state);

    const pieceType: TetrominoType = this.state.nextPiece ?? this.randomizer.next();
    this.state.nextPiece = this.randomizer.next();
    const spawnPiece: ActivePiece = {
      type: pieceType,
      position: { ...DEFAULT_SPAWN_POSITION },
      rotation: 0,
      shape: getShape(pieceType, 0),
    };

    const hasCollision = checkCollision(this.state.board, spawnPiece);

    if (hasCollision) {
      this.state.gameOver = true;
      this.state.activePiece = spawnPiece;
      return {
        success: false,
        linesCleared: [],
        gameOver: true,
      };
    }

    this.state.activePiece = spawnPiece;
    this.state.isLocking = isPieceOnGround(this.state.board, spawnPiece);
    if (this.state.isLocking) {
      startLockTimer(this.state);
    }

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
    validateBoard(board);
    this.state.board = board.map((row) => [...row]);
  }

  /**
   * ดึงสำเนากระดานปัจจุบัน
   */
  public getBoard(): Board {
    return this.state.board.map((row) => [...row]);
  }

  /**
   * ดึงสำเนา active piece ปัจจุบัน (null หากยังไม่ spawn)
   */
  public getActivePiece(): ActivePiece | null {
    const activePiece = this.state.activePiece;
    if (!activePiece) return null;
    return {
      ...activePiece,
      position: { ...activePiece.position },
      shape: activePiece.shape.map((row) => [...row]),
    };
  }

  /**
   * ดึงชิ้นส่วนถัดไปในคิว
   */
  public getNextPiece(): TetrominoType {
    return this.state.nextPiece ?? 'I';
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
    const status: GameStatus = this.state.gameOver ? 'gameover' : 'playing';

    return {
      board: this.state.board.map((row) => [...row]),
      activePiece: this.getActivePiece() ?? {
        type: this.state.nextPiece ?? 'T',
        position: { ...DEFAULT_SPAWN_POSITION },
        rotation: 0,
        shape: getShape(this.state.nextPiece ?? 'T', 0),
      },
      nextPiece: this.state.nextPiece ?? 'I',
      score: this.score,
      level: this.level,
      highScore: this.highScore,
      linesClearedTotal: this.state.linesClearedTotal ?? 0,
      status,
      isLocking: this.state.isLocking,
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

  public getHighScore(): number {
    return this.highScore;
  }


  public setHighScore(highScore: number): void {
    if (!Number.isFinite(highScore) || highScore < 0) {
      return;
    }
    this.highScore = Math.floor(highScore);
  }
  /**
    * เพิ่มคะแนนสะสม (เรียกโดย game-state-loop หลังคำนวณคะแนนจาก linesCleared)
    * กัน input ผิดปกติ (ติดลบ/NaN) ไม่ให้ทำลาย state
    */
  public addScore(points: number): void {
    if (!Number.isFinite(points) || points < 0) return;
    this.score += points;
  }

  /**
   * กำหนด level ปัจจุบัน (เรียกโดย game-state-loop หลังคำนวณจาก linesClearedTotal)
   * บังคับขั้นต่ำ level 1 เสมอ
   */
  public setLevel(level: number): void {
    if (!Number.isFinite(level)) return;
    this.level = Math.max(1, Math.floor(level));
  }

  /**
   * ดึงจำนวนแถวที่เคลียร์สะสมทั้งหมด (สมมาตรกับ getScore()/getLevel())
  */
  public getLinesClearedTotal(): number {
    return this.state.linesClearedTotal ?? 0;
  }

  /**
   * ตรวจสอบว่าสถานะเกมจบลงแล้วหรือไม่
   */
  public isGameOver(): boolean {
    return this.state.gameOver ?? false;
  }

  /**
   * Helper สำหรับตั้งค่า activePiece โดยตรง (สำหรับ Unit Test)
   */
  public setActivePiece(piece: ActivePiece | null): void {
    cancelLockTimer(this.state);
    const pieceCopy = piece ? {
      ...piece,
      position: { ...piece.position },
      shape: piece.shape.map((row) => [...row]),
    } : null;
    this.state.activePiece = pieceCopy;
    if (pieceCopy && isPieceOnGround(this.state.board, pieceCopy)) {
      startLockTimer(this.state);
    }
  }

  /** Register or clear the loop's lock-result callback. */
  public setLockCallback(callback: ((result: ActionResult) => void) | null): void {
    this.lockCallback = callback;
  }

  /** Pause lock delay while preserving whether it should resume. */
  public pauseLockTimer(): boolean {
    const wasLocking = this.state.isLocking || this.state.lockTimer !== null;
    cancelLockTimer(this.state);
    return wasLocking;
  }

  /** Read-only lock timer status for diagnostics and tests. */
  public hasActiveLockTimer(): boolean {
    return this.state.lockTimer !== null;
  }

  /** Resume lock delay only while the current piece remains grounded. */
  public resumeLockTimer(): void {
    const piece = this.state.activePiece;
    if (piece && isPieceOnGround(this.state.board, piece)) {
      startLockTimer(this.state);
    }
  }

  /** Helper for deterministic queue setup in engine tests. */
  public setNextPieceForTesting(piece: TetrominoType): void {
    this.state.nextPiece = piece;
  }

}