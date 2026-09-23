import type {
  CoreEngine,
  RenderSnapshot,
  GameAction,
  SaveData,
  ActionResult,
  GameStatus,
  InputSource,
} from '../shared/types';

import { saveGame, loadGame } from '../persistence';
import { calculateScore } from './score';
import { calculateLevel, getSpeedForLevel } from './level';
import { cancelLockTimer, startLockTimer } from '../core-engine/movement';
import type { MovementState } from '../core-engine/movement';

/**
 * ตัวเลือกสำหรับการตั้งค่า GameStateLoop (Dependency Injection)
 */
export interface GameStateLoopOptions {
  /** Core Engine ที่ implement ตามสัญญากลาง CoreEngine */
  engine: CoreEngine;
  /** ฟังก์ชันสำหรับวาดการแสดงผล (เช่น ConsoleRenderer.render) */
  renderer?: (snapshot: RenderSnapshot) => void;
  /** โมดูลรับอินพุตจากคีย์บอร์ด */
  input?: InputSource;
  /** Callback สำหรับบันทึกคะแนน (Persistence) — หากไม่ระบุจะใช้ saveGame เป็นค่าเริ่มต้น */
  onSave?: (data: SaveData) => Promise<void> | void;
  /** Callback สำหรับโหลดข้อมูลเกม (หากไม่ระบุจะใช้ loadGame เป็นค่าเริ่มต้น) */
  onLoad?: () => SaveData | null;
  /** ตำแหน่งไฟล์สำหรับบันทึกข้อมูล (กรณีใช้ default onSave) */
  saveFilePath?: string;
}

/**
 * ตัวประสานงานกลาง (Orchestrator) ที่เชื่อมโยง CoreEngine, KeyboardInput, และ Renderer
 * ควบคุม Gravity Tick Loop อัตโนมัติ, การคำนวณคะแนนและเลเวล, ระบบ Pause/Resume,
 * และการหยุดเกมเพื่อบันทึกข้อมูลคะแนนเมื่อ Game Over หรือ Quit
 */
export class GameStateLoop {
  private readonly engine: CoreEngine;
  private readonly renderer?: (snapshot: RenderSnapshot) => void;
  private readonly input?: InputSource;
  private readonly onSave?: (data: SaveData) => Promise<void> | void;
  private readonly onLoad?: () => SaveData | null;
  private readonly saveFilePath?: string;

  private running: boolean = false;
  private paused: boolean = false;
  private isGameOverState: boolean = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private saveTriggered: boolean = false;
  private wasLockingBeforePause: boolean = false;
  private lockHandledDuringAction: boolean = false;

  constructor(options: GameStateLoopOptions) {
    this.engine = options.engine;
    this.renderer = options.renderer;
    this.input = options.input;
    this.saveFilePath = options.saveFilePath;
    this.onSave = options.onSave ?? ((data: SaveData) => saveGame(data, this.saveFilePath));
    this.onLoad = options.onLoad ?? (() => loadGame(this.saveFilePath));
    const lockAwareEngine = this.engine as CoreEngine & {
      onLock?: (result: ActionResult) => void;
    };
    lockAwareEngine.onLock = (result) => this.handleLockedResult(result);
  }

  /**
   * เริ่มต้นการทำงานของ Game Loop
   */
  public start(): void {
    if (this.running) return;

    this.running = true;
    this.paused = false;
    this.isGameOverState = false;
    this.saveTriggered = false;
    this.wasLockingBeforePause = false;
    this.lockHandledDuringAction = false;

    // โหลด high score จาก persistence layer และตั้งค่าให้ engine
    const highScoreEngine = this.engine as CoreEngine & {
      setHighScore?: (highScore: number) => void;
    };
    highScoreEngine.setHighScore?.(this.loadGame()?.highScore ?? 0);

    // หากกระดานยังไม่มี active piece ให้ spawn ชิ้นแรกเตรียมไว้
    const engineTarget = this.engine as unknown as {
      getActivePiece?: () => unknown;
      activePiece?: unknown;
    };
    if (typeof engineTarget.getActivePiece === 'function') {
      if (engineTarget.getActivePiece() === null) {
        this.engine.spawnNextPiece();
      }
    } else if ('activePiece' in engineTarget && engineTarget.activePiece === null) {
      this.engine.spawnNextPiece();
    }

    // หาก engine อยู่ในสถานะ gameOver ตั้งแต่เริ่ม
    if (this.engine.isGameOver()) {
      this.handleGameOver();
      return;
    }

    // เริ่มรับ keyboard input
    if (this.input) {
      this.input.start((action: GameAction) => this.handleAction(action));
    }

    // วาดเฟรมแรก
    this.render();

    // เริ่มรอบ gravity tick
    this.scheduleTick();
  }

  /**
   * หยุด Game Loop และสั่งบันทึกคะแนน
   */
  public stop(): void {
    if (!this.running) return;

    this.running = false;
    this.clearTickTimer();
    this.clearLockTimer();
    this.wasLockingBeforePause = false;
    this.lockHandledDuringAction = false;

    if (this.input) {
      this.input.stop();
    }

    const lockAwareEngine = this.engine as CoreEngine & {
      onLock?: (result: ActionResult) => void;
    };
    lockAwareEngine.onLock = undefined;

    this.triggerSave();
  }

  /**
   * พักเกมชั่วคราว (หยุด tick loop และเพิกเฉยคำสั่งเคลื่อนที่)
   */
  public pause(): void {
    if (!this.running || this.paused) return;

    this.paused = true;
    this.clearTickTimer();

    const lockAwareEngine = this.engine as unknown as {
      lockTimer?: ReturnType<typeof setTimeout> | null;
      isLocking?: boolean;
    };
    if (lockAwareEngine.lockTimer || lockAwareEngine.isLocking) {
      this.wasLockingBeforePause = true;
      this.clearLockTimer();
    } else {
      this.wasLockingBeforePause = false;
    }

    this.render();
  }

  /**
   * เล่นเกมต่อจากสถานะพัก (Resume)
   */
  public resume(): void {
    if (!this.running || !this.paused) return;

    this.paused = false;
    this.render();

    if (this.wasLockingBeforePause) {
      this.wasLockingBeforePause = false;
      const engineTarget = this.engine as unknown as {
        board?: unknown;
        activePiece?: unknown;
        startLockTimer?: () => void;
      };
      if (typeof engineTarget.startLockTimer === 'function') {
        engineTarget.startLockTimer();
      } else if (engineTarget.board && engineTarget.activePiece) {
        startLockTimer(this.engine as unknown as MovementState);
      }
    }

    this.scheduleTick();
  }

  /**
   * สลับระหว่าง Pause และ Resume
   */
  public togglePause(): void {
    if (this.paused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  /**
   * ตรวจสอบว่า loop กำลังทำงานอยู่หรือไม่
   */
  public isRunning(): boolean {
    return this.running;
  }

  /**
   * ตรวจสอบว่าเกมอยู่ในสถานะ Pause หรือไม่
   */
  public isPaused(): boolean {
    return this.paused;
  }

  /**
   * ดึง CoreEngine ที่ใช้งานอยู่
   */
  public getEngine(): CoreEngine {
    return this.engine;
  }


  /**
   * จัดการ Action ที่ได้รับจาก KeyboardInput หรือเรียกจากภายนอก
   */
  public handleAction(action: GameAction): void {
    if (!this.running) return;

    if (action === 'QUIT') {
      this.stop();
      return;
    }

    if (action === 'PAUSE') {
      this.togglePause();
      return;
    }

    // หากเกมอยู่ในสถานะ Pause จะเพิกเฉยคำสั่งควบคุมตัวต่อ
    if (this.paused) {
      return;
    }

    this.lockHandledDuringAction = false;
    let result: ActionResult | undefined;

    switch (action) {
      case 'MOVE_LEFT':
        result = this.engine.moveLeft();
        break;
      case 'MOVE_RIGHT':
        result = this.engine.moveRight();
        break;
      case 'SOFT_DROP':
        result = this.engine.softDrop();
        break;
      case 'ROTATE':
        result = this.engine.rotate();
        break;
      case 'HARD_DROP':
        result = this.engine.hardDrop();
        break;
      default:
        return;
    }

    if (result) {
      if (!this.lockHandledDuringAction) {
        this.processActionResult(result);
      }

      if (result.gameOver || this.engine.isGameOver()) {
        this.handleGameOver();
        return;
      }
    }

    if (this.lockHandledDuringAction) {
      return;
    }

    // หลัง hardDrop บล็อกล็อกทันทีและเกิดชิ้นใหม่ จึงตั้งเวลารอบถัดไปใหม่
    if (action === 'HARD_DROP') {
      this.scheduleTick();
    }

    this.render();
  }

  /**
   * ประมวลผล Gravity Tick 1 รอบ
   */
  public tick(): ActionResult {
    if (!this.running || this.paused) {
      return {
        success: false,
        linesCleared: [],
        gameOver: this.engine.isGameOver(),
      };
    }

    const result = this.engine.tick();
    this.processActionResult(result);

    if (result.gameOver || this.engine.isGameOver()) {
      this.handleGameOver();
      return result;
    }

    this.render();
    this.scheduleTick();
    return result;
  }

  /**
   * ประมวลผลคะแนนและการเลื่อนเลเวลจาก ActionResult
   */
  private processActionResult(result: ActionResult): void {
    if (result.linesCleared && result.linesCleared.length > 0) {
      const points = calculateScore(
        result.linesCleared.length,
        this.engine.getLevel()
      );

      this.engine.addScore(points);
      const currentScore = this.engine.getScore();
      const currentHighScore = this.engine.getHighScore();

    if (currentScore > currentHighScore) {
      this.engine.setHighScore(currentScore);
      }

      const newLevel = calculateLevel(
        this.engine.getLinesClearedTotal()
      );

      this.engine.setLevel(newLevel);
   }
  }

  private handleLockedResult(result: ActionResult): void {
    if (!this.running || this.paused) return;

    this.lockHandledDuringAction = true;
    this.processActionResult(result);
    if (result.gameOver || this.engine.isGameOver()) {
      this.handleGameOver();
      return;
    }

    this.render();
    this.scheduleTick();
  }

  /**
   * จัดการเมื่อเกมจบลง (Game Over)
   */
  private handleGameOver(): void {
    this.isGameOverState = true;
    this.running = false;
    this.clearTickTimer();
    this.clearLockTimer();
    this.wasLockingBeforePause = false;

    if (this.input) {
      this.input.stop();
    }

    this.render('gameover');
    this.triggerSave();
  }

  /**
   * ส่งสัญญาณบันทึกคะแนนไปยัง persistence layer
   */
  public triggerSave(): void {
    if (this.saveTriggered) return;
    this.saveTriggered = true;

    if (this.onSave) {
      // โหลดเซฟเก่ามาดู high score สูงสุด
      const previousData = this.loadGame();
      const currentScore = this.engine.getScore();
      const previousHighScore = previousData?.highScore ?? 0;
      const isNewHighScore = currentScore > previousHighScore;
      const highScore = isNewHighScore ? currentScore : previousHighScore;

      // level/linesCleared ต้องเป็นของ "ตาเดียวกัน" กับ highScore ที่บันทึกไว้เสมอ
      // ถ้าตานี้ไม่ได้ทำลายสถิติ ต้องคง level/linesCleared เดิมของตาที่ทำ highScore
      // ไว้ ไม่ใช่เขียนทับด้วยค่าของตาปัจจุบันซึ่งอาจเป็นตาที่ทำคะแนนได้น้อยกว่า
      const level = isNewHighScore
        ? this.engine.getLevel()
        : previousData?.level ?? this.engine.getLevel();
      const linesCleared = isNewHighScore
        ? this.engine.getLinesClearedTotal()
        : previousData?.linesCleared ?? this.engine.getLinesClearedTotal();

      const saveData: SaveData = {
        version: 1,
        highScore, // <-- ใช้ค่าที่สูงสุดระหว่างรอบนี้กับรอบก่อนหน้า
        level, // <-- ของตาที่ทำ highScore จริง ไม่ใช่ของตาปัจจุบันเสมอไป
        linesCleared, // <-- เช่นเดียวกัน
        timestamp: new Date().toISOString(),
      };

      try {
        const result = this.onSave(saveData);
        if (result instanceof Promise) {
          result.catch((error) => {
            console.error('Failed to save game data:', error);
          });
        }
      } catch (error) {
        console.error('Failed to save game data:', error);
      }
    }
  }

  /**
   * โหลดข้อมูลเกมที่เคยบันทึกไว้
   */
  public loadGame(): SaveData | null {
    if (this.onLoad) {
      return this.onLoad();
    }
    return loadGame(this.saveFilePath);
  }


  /**
   * กำหนดเวลารอบ gravity tick ถัดไปตามความเร็วของเลเวล
   */
  private scheduleTick(): void {
    this.clearTickTimer();
    if (!this.running || this.paused) return;

    const delay = getSpeedForLevel(this.engine.getLevel());
    this.timer = setTimeout(() => {
      this.tick();
    }, delay);
  }

  /**
   * ล้าง timer ของ gravity tick
   */
  private clearTickTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * ล้าง timer ของ lock delay ใน engine
   */
  private clearLockTimer(): void {
    const lockAwareEngine = this.engine as unknown as {
      lockTimer?: ReturnType<typeof setTimeout> | null;
      isLocking?: boolean;
      cancelLockTimer?: () => void;
    };
    if (typeof lockAwareEngine.cancelLockTimer === 'function') {
      lockAwareEngine.cancelLockTimer();
    } else {
      cancelLockTimer(lockAwareEngine as MovementState);
    }
  }

  /**
   * ส่ง snapshot ล่าสุดไปยัง renderer
   */
  private render(forcedStatus?: GameStatus): void {
    if (!this.renderer) return;

    const snapshot = this.engine.getRenderSnapshot();

    if (forcedStatus) {
      snapshot.status = forcedStatus;
    } else if (this.paused) {
      snapshot.status = 'paused';
    } else if (this.isGameOverState || this.engine.isGameOver()) {
      snapshot.status = 'gameover';
    }

    this.renderer(snapshot);
  }
}