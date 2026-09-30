// 02-Tests/game-state-loop/game-state-loop.test.ts
import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { GameStateLoop } from '../../01-Source-code/game-state-loop/GameStateLoop';
import { CURRENT_SAVE_VERSION, loadGame } from '../../01-Source-code/persistence';
import { TetrisEngine } from '../../01-Source-code/core-engine/TetrisEngine';
import { createEmptyBoard, setCell } from '../../01-Source-code/shared/board-utils';
import { getShape } from '../../01-Source-code/core-engine/tetromino-shapes';
import { LOCK_DELAY_MS } from '../../01-Source-code/shared/constants';
import type {
  CoreEngine,
  ActionResult,
  RenderSnapshot,
  GameAction,
  SaveData,
  InputSource,
  ActivePiece,
} from '../../01-Source-code/shared/types';

const TEST_DIR = path.resolve(__dirname, 'test-temp-gameloop');
const TEST_SAVE_FILE = path.join(TEST_DIR, 'test-save.json');

class MockEngine implements CoreEngine {
  public score = 0;
  public highScore = 0
  public level = 1;
  public linesClearedTotal = 0;
  public gameOver = false;
  public movesCalled: string[] = [];
  public lastActionResult: ActionResult = { success: true, linesCleared: [], gameOver: false };
  private lockCallback: ((result: ActionResult) => void) | null = null;
  private lockPaused = false;

  public moveLeft(): ActionResult {
    this.movesCalled.push('moveLeft');
    return this.lastActionResult;
  }
  public moveRight(): ActionResult {
    this.movesCalled.push('moveRight');
    return this.lastActionResult;
  }
  public softDrop(): ActionResult {
    this.movesCalled.push('softDrop');
    return this.lastActionResult;
  }
  public rotate(): ActionResult {
    this.movesCalled.push('rotate');
    return this.lastActionResult;
  }
  public hardDrop(): ActionResult {
    this.movesCalled.push('hardDrop');
    return this.lastActionResult;
  }
  public tick(): ActionResult {
    this.movesCalled.push('tick');
    return this.lastActionResult;
  }
  public spawnNextPiece(): ActionResult {
    this.movesCalled.push('spawnNextPiece');
    return this.lastActionResult;
  }
  private activePiece: ActivePiece = {
    type: 'T',
    position: { x: 4, y: 0 },
    rotation: 0,
    shape: [
      [0, 1, 0, 0],
      [1, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  };

  public getActivePiece(): ActivePiece | null { return this.activePiece; }
  public setLockCallback(callback: ((result: ActionResult) => void) | null): void { this.lockCallback = callback; }
  public pauseLockTimer(): boolean { const wasPaused = this.lockPaused; this.lockPaused = false; return wasPaused; }
  public resumeLockTimer(): void { this.lockPaused = true; }
  public emitLock(result: ActionResult): void { this.lockCallback?.(result); }
  public hasLockCallback(): boolean { return this.lockCallback !== null; }
  public getRenderSnapshot(): RenderSnapshot {
    return {
      board: createEmptyBoard(),
      activePiece: this.activePiece,
      nextPiece: 'I',
      score: this.score,
      level: this.level,
      highScore: this.highScore,
      linesClearedTotal: this.linesClearedTotal,
      status: this.gameOver ? 'gameover' : 'playing',
      isLocking: false,
    };
  }
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }
  public getHighScore(): number { return this.highScore; }
  public setHighScore(score: number): void { this.highScore = score; }
  public isGameOver(): boolean { return this.gameOver; }
  public addScore(points: number): void { this.score += points; }
  public setLevel(lvl: number): void { this.level = lvl; }
  public getLinesClearedTotal(): number { return this.linesClearedTotal; }
}

class MockInput implements InputSource {
  public started = false;
  private onAction: ((action: GameAction) => void) | null = null;

  public start(onAction: (action: GameAction) => void): void {
    this.started = true;
    this.onAction = onAction;
  }

  public stop(): void {
    this.started = false;
    this.onAction = null;
  }

  public emit(action: GameAction): void {
    this.onAction?.(action);
  }
}

describe('GameStateLoop Orchestrator', () => {
  let engine: MockEngine;

  beforeEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DIR, { recursive: true });
    engine = new MockEngine();
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  test('start() เริ่มต้น game loop และสถานะถูกต้อง', async () => {
    const loop = new GameStateLoop({ engine, saveFilePath: TEST_SAVE_FILE });
    expect(loop.isRunning()).toBe(false);

    await loop.start();
    expect(loop.isRunning()).toBe(true);
    expect(loop.isPaused()).toBe(false);
    expect(loop.getEngine()).toBe(engine);

    loop.stop();
    expect(loop.isRunning()).toBe(false);
  });

  test('ไม่ใช้ highScore ติดลบจาก onLoad เป็นสถิติเดิม', async () => {
    let saveCount = 0;
    engine.score = 0;
    const loop = new GameStateLoop({
      engine,
      saveFilePath: TEST_SAVE_FILE,
      onLoad: () => ({ version: CURRENT_SAVE_VERSION, highScore: -100 }),
      onSave: () => { saveCount++; },
    });

    await loop.start();
    expect(engine.highScore).toBe(0);

    await loop.triggerSave();
    expect(saveCount).toBe(0);
    loop.stop();
  });

  test('pause(), resume(), และ togglePause() สลับสถานะได้ถูกต้อง', async () => {
    const loop = new GameStateLoop({ engine, saveFilePath: TEST_SAVE_FILE });
    await loop.start();

    loop.pause();
    expect(loop.isPaused()).toBe(true);

    loop.resume();
    expect(loop.isPaused()).toBe(false);

    loop.togglePause();
    expect(loop.isPaused()).toBe(true);

    loop.togglePause();
    expect(loop.isPaused()).toBe(false);

    loop.stop();
  });

  test('handleAction() ส่งคำสั่งไปยัง CoreEngine อย่างถูกต้อง', async () => {
    const loop = new GameStateLoop({ engine, saveFilePath: TEST_SAVE_FILE });
    await loop.start();

    loop.handleAction('MOVE_LEFT');
    expect(engine.movesCalled).toContain('moveLeft');

    loop.handleAction('MOVE_RIGHT');
    expect(engine.movesCalled).toContain('moveRight');

    loop.handleAction('SOFT_DROP');
    expect(engine.movesCalled).toContain('softDrop');

    loop.handleAction('ROTATE');
    expect(engine.movesCalled).toContain('rotate');

    loop.handleAction('HARD_DROP');
    expect(engine.movesCalled).toContain('hardDrop');

    loop.stop();
  });

  test('handleAction() เพิกเฉยคำสั่งเคลื่อนที่เมื่ออยู่ในสถานะ Pause', async () => {
    const loop = new GameStateLoop({ engine, saveFilePath: TEST_SAVE_FILE });
    await loop.start();
    loop.pause();
    engine.movesCalled = [];

    loop.handleAction('MOVE_LEFT');
    loop.handleAction('MOVE_RIGHT');
    loop.handleAction('ROTATE');
    expect(engine.movesCalled.length).toBe(0);

    loop.stop();
  });

  test('handleAction(QUIT) สั่งหยุด loop และ trigger save', async () => {
    let saved = false;
    let stopCount = 0;
    const input = new MockInput();
    engine.score = 1;
    const loop = new GameStateLoop({
      engine,
      input,
      saveFilePath: TEST_SAVE_FILE,
      onLoad: () => null,
      onSave: () => { saved = true; },
      onStop: () => { stopCount++; },
    });
    await loop.start();
    loop.handleAction('QUIT');
    await loop.triggerSave();

    expect(loop.isRunning()).toBe(false);
    expect(saved).toBe(true);
    expect(stopCount).toBe(1);
    expect(input.started).toBe(false);
    loop.stop();
    expect(stopCount).toBe(1);
  });

  test('ไม่เรียก onSave เมื่อคะแนนไม่ทำลายสถิติเดิม', async () => {
    let saveCount = 0;
    const loop = new GameStateLoop({
      engine,
      saveFilePath: TEST_SAVE_FILE,
      onLoad: () => ({
        version: 1,
        highScore: 1000,
      }),
      onSave: () => { saveCount++; },
    });
    engine.score = 500;
    await loop.start();
    loop.handleAction('QUIT');
    await loop.triggerSave();

    expect(saveCount).toBe(0);
  });

  test('tick() คำนวณคะแนนและเลเวลเมื่อมีการเคลียร์แถว', async () => {
    const loop = new GameStateLoop({ engine, saveFilePath: TEST_SAVE_FILE });
    await loop.start();

    // จำลองผลลัพธ์ tick ที่ลบ 2 แถว
    engine.lastActionResult = {
      success: true,
      linesCleared: [18, 19],
      gameOver: false,
    };
    engine.linesClearedTotal = 2;

    loop.tick();

    // 2 แถวที่ Level 1 ได้ 250 คะแนน
    expect(engine.getScore()).toBe(250);

    loop.stop();
  });

  test('tick() หยุดเกมและเรียก onSave เมื่อเกิด Game Over', async () => {
    let savedData: SaveData | null = null;
    engine.score = 500;

    const loop = new GameStateLoop({
      engine,
      saveFilePath: TEST_SAVE_FILE,
      onLoad: () => null,
      onSave: (data) => { savedData = data; },
    });
    await loop.start();

    // จำลอง Game Over จาก tick
    engine.lastActionResult = {
      success: false,
      linesCleared: [],
      gameOver: true,
    };
    engine.gameOver = true;

    loop.tick();
    await loop.triggerSave();

    expect(savedData).not.toBeNull();
    expect(savedData!.highScore).toBe(500);
  });

  test('จัดการผลลัพธ์เมื่อชิ้นส่วนถูกล็อก', async () => {
    let renderCount = 0;
    const loop = new GameStateLoop({
      engine,
      saveFilePath: TEST_SAVE_FILE,
      renderer: () => { renderCount++; },
      onLoad: () => null,
    });
    await loop.start();

    expect(engine.hasLockCallback()).toBe(true);

    engine.linesClearedTotal = 2;
    engine.emitLock({
      success: true,
      linesCleared: [18, 19],
      gameOver: false,
    });

    expect(engine.getScore()).toBe(250);
    expect(engine.getHighScore()).toBe(250);
    expect(renderCount).toBe(2);
    loop.stop();
  });

  test('ละเว้นผลลัพธ์การล็อกเมื่อเกมหยุดหรือพัก', async () => {
    let renderCount = 0;
    const loop = new GameStateLoop({
      engine,
      saveFilePath: TEST_SAVE_FILE,
      renderer: () => { renderCount++; },
    });
    await loop.start();

    loop.pause();
    const pausedRenderCount = renderCount;
    engine.emitLock({ success: true, linesCleared: [], gameOver: false });
    expect(renderCount).toBe(pausedRenderCount);

    loop.resume();
    loop.stop();
    const stoppedRenderCount = renderCount;
    engine.emitLock({ success: true, linesCleared: [], gameOver: false });
    expect(renderCount).toBe(stoppedRenderCount);
  });

  test('จบเกมเมื่อผลลัพธ์จากการล็อกระบุ Game Over', async () => {
    let renderedStatus = '';
    const loop = new GameStateLoop({
      engine,
      saveFilePath: TEST_SAVE_FILE,
      renderer: (snapshot) => { renderedStatus = snapshot.status; },
    });
    await loop.start();

    engine.emitLock({ success: false, linesCleared: [], gameOver: true });

    expect(loop.isRunning()).toBe(false);
    expect(renderedStatus).toBe('gameover');
  });

  test('Game Over คงหน้าจอและรับปุ่มออกก่อนล้างทรัพยากรทั้งหมด', async () => {
    const input = new MockInput();
    let renderedStatus = '';
    let stopCount = 0;
    const loop = new GameStateLoop({
      engine,
      input,
      saveFilePath: TEST_SAVE_FILE,
      renderer: (snapshot) => { renderedStatus = snapshot.status; },
      onLoad: () => null,
      onStop: () => { stopCount++; },
    });
    await loop.start();

    engine.gameOver = true;
    engine.lastActionResult = {
      success: false,
      linesCleared: [],
      gameOver: true,
    };
    loop.tick();

    expect(loop.isRunning()).toBe(false);
    expect(renderedStatus).toBe('gameover');
    expect(input.started).toBe(true);
    expect(engine.hasLockCallback()).toBe(false);
    expect(stopCount).toBe(0);

    input.emit('MOVE_LEFT');
    expect(engine.movesCalled).not.toContain('moveLeft');
    expect(renderedStatus).toBe('gameover');

    input.emit('QUIT');
    expect(input.started).toBe(false);
    expect(stopCount).toBe(1);
    expect(renderedStatus).toBe('gameover');
  });

  test('เรียก renderer callback ในแต่ละรอบ', async () => {
    let renderCount = 0;
    const loop = new GameStateLoop({
      engine,
      saveFilePath: TEST_SAVE_FILE,
      renderer: () => { renderCount++; },
    });

    await loop.start(); // วาดเฟรมแรก 1 ครั้ง
    expect(renderCount).toBe(1);

    loop.handleAction('MOVE_LEFT');
    expect(renderCount).toBe(2);

    loop.tick();
    expect(renderCount).toBe(3);

    loop.stop();
  });
});

describe('GameStateLoop Integration with real TetrisEngine', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  test('ขับเคลื่อนการเล่นเกมพื้นฐานด้วย TetrisEngine จริง (spawn, move, rotate, hardDrop, tick, stop)', async () => {
    const engine = new TetrisEngine();
    const input = new MockInput();
    let renderSnapshots: RenderSnapshot[] = [];
    let stopCalled = false;

    const loop = new GameStateLoop({
      engine,
      input,
      saveFilePath: TEST_SAVE_FILE,
      renderer: (snapshot) => { renderSnapshots.push(snapshot); },
      onStop: () => { stopCalled = true; },
    });

    await loop.start();

    expect(loop.isRunning()).toBe(true);
    expect(renderSnapshots.length).toBeGreaterThanOrEqual(1);
    expect(renderSnapshots[0]?.status).toBe('playing');
    expect(engine.getActivePiece()).not.toBeNull();

    const initialX = engine.getActivePiece()!.position.x;

    // เคลื่อนที่ซ้าย
    loop.handleAction('MOVE_LEFT');
    expect(engine.getActivePiece()!.position.x).toBe(initialX - 1);

    // เคลื่อนที่ขวา
    loop.handleAction('MOVE_RIGHT');
    expect(engine.getActivePiece()!.position.x).toBe(initialX);

    // หมุน piece
    const initialRotation = engine.getActivePiece()!.rotation;
    loop.handleAction('ROTATE');
    expect(engine.getActivePiece()!.rotation).toBe(((initialRotation + 1) % 4) as any);

    // Gravity tick
    const initialY = engine.getActivePiece()!.position.y;
    loop.tick();
    expect(engine.getActivePiece()!.position.y).toBe(initialY + 1);

    // หยุดเกมผ่าน QUIT
    input.emit('QUIT');
    expect(loop.isRunning()).toBe(false);
    expect(stopCalled).toBe(true);
    expect(input.started).toBe(false);
  });

  test('Integration Issue 1: piece ที่ spawn บนกองบล็อกจะ auto-lock ด้วย lock delay ของ engine จริง และ loop จัดการ lock callback ถูกต้อง', async () => {
    // จำลองสถานการณ์ Issue 1 (Issue 138):
    // 1. วางบล็อกที่แถว 2 คอลัมน์ 2-7
    // 2. ตั้งชิ้นส่วนปัจจุบันให้อยู่แถวล่าง (y=17)
    // 3. เมื่อสั่ง HARD_DROP ชิ้นส่วนแรกล็อกติดพื้น และชิ้นถัดไป spawn ที่ y=0 แตะบล็อกแถว 2 ทันที
    // 4. lock delay timer บน engine จริงต้องทำงาน และเมื่อครบ LOCK_DELAY_MS ชิ้นส่วนใหม่จะ auto-lock ลง board จริง
    let board = createEmptyBoard();
    for (let x = 2; x <= 7; x++) {
      board = setCell(board, x, 2, 'I');
    }

    const engine = new TetrisEngine(undefined, board);
    const bottomPiece: ActivePiece = {
      type: 'O',
      position: { x: 0, y: 17 },
      rotation: 0,
      shape: getShape('O', 0),
    };
    engine.setActivePiece(bottomPiece);

    let renderCount = 0;
    const loop = new GameStateLoop({
      engine,
      saveFilePath: TEST_SAVE_FILE,
      renderer: () => { renderCount++; },
    });

    await loop.start();
    expect(loop.isRunning()).toBe(true);

    // สั่ง HARD_DROP ชิ้นแรก เพื่อกระตุ้นให้ชิ้นถัดไป spawn ลงมาแตะบล็อกที่แถว 2
    loop.handleAction('HARD_DROP');

    // ตรวจสอบว่าชิ้นใหม่ที่ spawn แตะกองบล็อกและเริ่ม lock delay timer บน engine จริง
    expect(engine.isLocking).toBe(true);
    expect(engine.hasActiveLockTimer()).toBe(true);

    // รอให้ lock delay timer (500ms) บน engine จริงทำงานจนหมดเวลา
    await new Promise((resolve) => setTimeout(resolve, LOCK_DELAY_MS + 150));

    // ชิ้นส่วนต้องถูกล็อกลงบน board จริงเรียบร้อยแล้ว
    expect(engine.hasActiveLockTimer()).toBe(false);
    const currentBoard = engine.getBoard();
    const hasBlocksInSpawnZone = currentBoard[1]?.some((cell) => cell !== 0);
    expect(hasBlocksInSpawnZone).toBe(true);

    // เมื่อบล็อกสูงเต็มโซน spawn ชิ้นถัดไปชนขอบบนทำให้เกิด Game Over ตามกฎ และ loop รับ callback จัดการ gameover อย่างถูกต้อง
    expect(engine.isGameOver()).toBe(true);
    expect(loop.isRunning()).toBe(false);
  });

  test('Integration: Lock delay บน engine จริงที่พื้นล่าง ล็อกชิ้นส่วนแล้วเกมดำเนินต่อได้อย่างสมบูรณ์', async () => {
    const engine = new TetrisEngine();
    // วาง activePiece ไว้ที่ y=17 เหนือพื้นล่าง (y=18 แตะพื้น)
    engine.setActivePiece({
      type: 'O',
      position: { x: 3, y: 17 },
      rotation: 0,
      shape: getShape('O', 0),
    });

    const loop = new GameStateLoop({
      engine,
      saveFilePath: TEST_SAVE_FILE,
    });

    await loop.start();
    // softDrop ลงมาที่ y=18 (แตะพื้นล่างสุด)
    loop.handleAction('SOFT_DROP');
    expect(engine.isLocking).toBe(true);
    expect(engine.hasActiveLockTimer()).toBe(true);

    // รอให้ LOCK_DELAY_MS ผ่านไป
    await new Promise((resolve) => setTimeout(resolve, LOCK_DELAY_MS + 150));

    // ชิ้นส่วนถูกล็อกที่ก้นกระดาน
    expect(engine.hasActiveLockTimer()).toBe(false);
    const board = engine.getBoard();
    expect(board[18]?.some((c) => c !== 0)).toBe(true);

    // เนื่องจากการล็อกอยู่ที่ก้นกระดาน เกมยังไม่จบและ loop ดำเนินการต่อได้
    expect(engine.isGameOver()).toBe(false);
    expect(loop.isRunning()).toBe(true);

    loop.stop();
    expect(loop.isRunning()).toBe(false);
  });

  test('Integration Issue 6: Game Over คงหน้าจอ renderer และรอ Q ก่อน unmount renderer และล้าง input', async () => {
    // จำลองสถานการณ์ Issue 6 (Issue 143):
    // สร้างกระดานที่มีบล็อกเต็ม 4 แถวบน ทำให้ไม่สามารถ spawn piece ใหม่ได้ -> เกิด Game Over ตั้งแต่ start()
    let board = createEmptyBoard();
    for (let y = 0; y < 4; y++) {
      board[y]!.fill('I');
    }

    const engine = new TetrisEngine(undefined, board);
    const input = new MockInput();
    let stopCount = 0;
    let lastSnapshotStatus = '';

    const loop = new GameStateLoop({
      engine,
      input,
      saveFilePath: TEST_SAVE_FILE,
      renderer: (snapshot) => {
        lastSnapshotStatus = snapshot.status;
      },
      onStop: () => {
        stopCount++;
      },
    });

    await loop.start();

    // 1. เกมเข้าสู่สถานะ Game Over ทันที
    expect(loop.isRunning()).toBe(false);
    expect(engine.isGameOver()).toBe(true);

    // 2. หน้าจอ Game Over ถูกวาดลง renderer (ไม่กะพริบหาย)
    expect(lastSnapshotStatus).toBe('gameover');

    // 3. onStop ยังไม่ถูกเรียกทันที (คงหน้าจอไว้ให้ผู้เล่นเห็น)
    expect(stopCount).toBe(0);

    // 4. input listener ยังคง active เพื่อรอรับปุ่ม Q
    expect(input.started).toBe(true);

    // 5. คำสั่งการเล่นทั่วไปถูกเพิกเฉย ไม่ขยับบล็อกและไม่เปลี่ยนหน้าจอ
    input.emit('MOVE_LEFT');
    input.emit('HARD_DROP');
    expect(stopCount).toBe(0);
    expect(lastSnapshotStatus).toBe('gameover');

    // 6. เมื่อผู้เล่นกด QUIT (Q) -> onStop ถูกเรียกเพื่อ unmount renderer และ input หยุดทำงาน
    input.emit('QUIT');
    expect(input.started).toBe(false);
    expect(stopCount).toBe(1);

    // 7. การเรียก stop() ซ้ำเป็น idempotent
    loop.stop();
    expect(stopCount).toBe(1);
  });

  test('Integration: ขับเคลื่อน GameStateLoop ด้วย TetrisEngine จริง พร้อมเคลียร์แถว คำนวณคะแนน และบันทึก High Score ลง temp file', async () => {
    // สร้างกระดานที่แถว 18 และ 19 มีบล็อกเกือบเต็ม เว้นเฉพาะคอลัมน์ 2 และ 3
    let board = createEmptyBoard();
    for (let x = 0; x < 10; x++) {
      if (x !== 2 && x !== 3) {
        board = setCell(board, x, 18, 'I');
        board = setCell(board, x, 19, 'I');
      }
    }

    const engine = new TetrisEngine(undefined, board);
    // วาง O-piece (2x2) ไว้ตรงคอลัมน์ 2 และ 3 พอดี (x=1 ใน bounding box 4x4)
    engine.setActivePiece({
      type: 'O',
      position: { x: 1, y: 10 },
      rotation: 0,
      shape: getShape('O', 0),
    });

    const loop = new GameStateLoop({
      engine,
      saveFilePath: TEST_SAVE_FILE,
    });

    await loop.start();

    // HARD_DROP จะทิ้ง O-piece ลงไปเติมเต็มแถว 18 และ 19 ทำให้เคลียร์พร้อมกัน 2 แถว
    loop.handleAction('HARD_DROP');

    // 2 แถวที่ Level 1 ได้ 250 คะแนน
    expect(engine.getScore()).toBe(250);
    expect(engine.getLinesClearedTotal()).toBe(2);

    // เมื่อจบเกม ข้อมูลต้องถูกบันทึกลง TEST_SAVE_FILE ชั่วคราว
    loop.stop();
    await loop.triggerSave();

    expect(fs.existsSync(TEST_SAVE_FILE)).toBe(true);
    const saved = await loadGame(TEST_SAVE_FILE);
    expect(saved).not.toBeNull();
    expect(saved?.highScore).toBe(250);
    expect(saved?.version).toBe(CURRENT_SAVE_VERSION);
  });

  test('Integration: Pause และ Resume ควบคุม gravity และ lock timer ของ TetrisEngine จริงได้ถูกต้อง', async () => {
    const engine = new TetrisEngine();
    const loop = new GameStateLoop({
      engine,
      saveFilePath: TEST_SAVE_FILE,
    });

    await loop.start();
    expect(loop.isRunning()).toBe(true);
    expect(loop.isPaused()).toBe(false);

    loop.pause();
    expect(loop.isPaused()).toBe(true);

    const initialPos = engine.getActivePiece()?.position;
    loop.handleAction('MOVE_LEFT');
    expect(engine.getActivePiece()?.position).toEqual(initialPos);

    loop.resume();
    expect(loop.isPaused()).toBe(false);

    loop.stop();
    expect(loop.isRunning()).toBe(false);
  });

  test('Gravity tick ทำงานอัตโนมัติผ่าน timer เมื่อครบเวลา delay', async () => {
    const engine = new MockEngine();
    engine.setLevel(10); // getSpeedForLevel(10) = 100ms
    const loop = new GameStateLoop({
      engine,
      saveFilePath: TEST_SAVE_FILE,
    });

    await loop.start();
    const initialTicks = engine.movesCalled.filter((m) => m === 'tick').length;

    // รอให้ timer ของ scheduleTick ทำงาน (100ms delay)
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(engine.movesCalled.filter((m) => m === 'tick').length).toBeGreaterThan(initialTicks);
    loop.stop();
  });
});