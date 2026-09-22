// 02-Tests/game-state-loop/game-state-loop.test.ts
import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { GameStateLoop } from '../../01-Source-code/game-state-loop/GameStateLoop';
import type { CoreEngine, ActionResult, RenderSnapshot, GameAction, SaveData } from '../../01-Source-code/shared/types';
import { mockRenderSnapshot } from '../../01-Source-code/shared/mock-engine';

class MockEngine implements CoreEngine {
  public score = 0;
  public level = 1;
  public linesClearedTotal = 0;
  public gameOver = false;
  public movesCalled: string[] = [];
  public lastActionResult: ActionResult = { success: true, linesCleared: [], gameOver: false };

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

  test('start() เริ่มต้น game loop และสถานะถูกต้อง', () => {
    const loop = new GameStateLoop({ engine });
    expect(loop.isRunning()).toBe(false);

    loop.start();
    expect(loop.isRunning()).toBe(true);
    expect(loop.isPaused()).toBe(false);
    expect(loop.getEngine()).toBe(engine);

    loop.stop();
    expect(loop.isRunning()).toBe(false);
  });

  test('pause(), resume(), และ togglePause() สลับสถานะได้ถูกต้อง', () => {
    const loop = new GameStateLoop({ engine });
    loop.start();

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

  test('handleAction() ส่งคำสั่งไปยัง CoreEngine อย่างถูกต้อง', () => {
    const loop = new GameStateLoop({ engine });
    loop.start();

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

  test('handleAction() เพิกเฉยคำสั่งเคลื่อนที่เมื่ออยู่ในสถานะ Pause', () => {
    const loop = new GameStateLoop({ engine });
    loop.start();
    loop.pause();
    engine.movesCalled = [];

    loop.handleAction('MOVE_LEFT');
    loop.handleAction('MOVE_RIGHT');
    loop.handleAction('ROTATE');
    expect(engine.movesCalled.length).toBe(0);

    loop.stop();
  });

  test('handleAction(QUIT) สั่งหยุด loop และ trigger save', () => {
    let saved = false;
    const loop = new GameStateLoop({
      engine,
      onSave: () => { saved = true; },
    });
    loop.start();
    loop.handleAction('QUIT');

    expect(loop.isRunning()).toBe(false);
    expect(saved).toBe(true);
  });

  test('tick() คำนวณคะแนนและเลเวลเมื่อมีการเคลียร์แถว', () => {
    const loop = new GameStateLoop({ engine });
    loop.start();

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

  test('tick() หยุดเกมและเรียก onSave เมื่อเกิด Game Over', () => {
    let savedData: SaveData | null = null;
    engine.score = 500;
    engine.level = 2;
    engine.linesClearedTotal = 10;

    const loop = new GameStateLoop({
      engine,
      onSave: (data) => { savedData = data; },
    });
    loop.start();

    // จำลอง Game Over จาก tick
    engine.lastActionResult = {
      success: false,
      linesCleared: [],
      gameOver: true,
    };
    engine.gameOver = true;

    loop.tick();

    expect(savedData).not.toBeNull();
    expect(savedData?.highScore).toBe(500);
    expect(savedData?.level).toBe(2);
  });

  test('เรียก renderer callback ในแต่ละรอบ', () => {
    let renderCount = 0;
    const loop = new GameStateLoop({
      engine,
      renderer: () => { renderCount++; },
    });

    loop.start(); // วาดเฟรมแรก 1 ครั้ง
    expect(renderCount).toBe(1);

    loop.handleAction('MOVE_LEFT');
    expect(renderCount).toBe(2);

    loop.tick();
    expect(renderCount).toBe(3);

    loop.stop();
  });
});
