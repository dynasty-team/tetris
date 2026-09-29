// 02-Tests/game-state-loop/game-state-loop.test.ts
import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { GameStateLoop } from '../../01-Source-code/game-state-loop/GameStateLoop';
import { CURRENT_SAVE_VERSION } from '../../01-Source-code/persistence/schema';
import type { CoreEngine, ActionResult, RenderSnapshot, GameAction, SaveData } from '../../01-Source-code/shared/types';
import { mockRenderSnapshot } from '../../01-Source-code/shared/mock-engine';

class MockEngine implements CoreEngine {
  public score = 0;
  public highScore = 0;
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
  public getActivePiece() { return mockRenderSnapshot.activePiece; }
  public setLockCallback(callback: ((result: ActionResult) => void) | null): void { this.lockCallback = callback; }
  public pauseLockTimer(): boolean { const wasPaused = this.lockPaused; this.lockPaused = false; return wasPaused; }
  public resumeLockTimer(): void { this.lockPaused = true; }
  public emitLock(result: ActionResult): void { this.lockCallback?.(result); }
  public hasLockCallback(): boolean { return this.lockCallback !== null; }
  public getRenderSnapshot(): RenderSnapshot {
    return {
      ...mockRenderSnapshot,
      score: this.score,
      level: this.level,
      linesClearedTotal: this.linesClearedTotal,
      status: this.gameOver ? 'gameover' : 'playing',
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

describe('GameStateLoop Orchestrator', () => {
  let engine: MockEngine;

  beforeEach(() => {
    engine = new MockEngine();
  });

  test('start() เริ่มต้น game loop และสถานะถูกต้อง', async () => {
    const loop = new GameStateLoop({ engine });
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
    const loop = new GameStateLoop({ engine });
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
    const loop = new GameStateLoop({ engine });
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
    const loop = new GameStateLoop({ engine });
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
    engine.score = 1;
    const loop = new GameStateLoop({
      engine,
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
    loop.stop();
    expect(stopCount).toBe(1);
  });

  test('ไม่เรียก onSave เมื่อคะแนนไม่ทำลายสถิติเดิม', async () => {
    let saveCount = 0;
    const loop = new GameStateLoop({
      engine,
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
    const loop = new GameStateLoop({ engine });
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
      renderer: (snapshot) => { renderedStatus = snapshot.status; },
    });
    await loop.start();

    engine.emitLock({ success: false, linesCleared: [], gameOver: true });

    expect(loop.isRunning()).toBe(false);
    expect(renderedStatus).toBe('gameover');
  });

  test('เรียก renderer callback ในแต่ละรอบ', async () => {
    let renderCount = 0;
    const loop = new GameStateLoop({
      engine,
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
