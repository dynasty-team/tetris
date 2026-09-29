// 02-Tests/persistence/save-load.test.ts

import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { saveGame, loadGame, validateSaveData, CURRENT_SAVE_VERSION } from '../../01-Source-code/persistence';
import type { SaveData, CoreEngine, ActionResult, RenderSnapshot } from '../../01-Source-code/shared/types';
import { GameStateLoop } from '../../01-Source-code/game-state-loop';
import { mockRenderSnapshot } from '../../01-Source-code/shared/mock-engine';

const TEST_DIR = path.resolve(__dirname, 'test-temp-persistence');
const TEST_SAVE_FILE = path.join(TEST_DIR, 'test-save.json');

class TestEngine implements CoreEngine {
  public highScore = 0
  public score = 0;
  public level = 1;
  public linesClearedTotal = 0;
  public gameOver = false;
  private lockCallback: ((result: ActionResult) => void) | null = null;

  public moveLeft(): ActionResult { return this.tick(); }
  public moveRight(): ActionResult { return this.tick(); }
  public softDrop(): ActionResult { return this.tick(); }
  public rotate(): ActionResult { return this.tick(); }
  public hardDrop(): ActionResult { return this.tick(); }
  public tick(): ActionResult { return { success: true, linesCleared: [], gameOver: this.gameOver }; }
  public spawnNextPiece(): ActionResult { return this.tick(); }
  public getActivePiece() { return mockRenderSnapshot.activePiece; }
  public setLockCallback(callback: ((result: ActionResult) => void) | null): void { this.lockCallback = callback; }
  public pauseLockTimer(): boolean { return false; }
  public resumeLockTimer(): void {}
  public getRenderSnapshot(): RenderSnapshot { return { ...mockRenderSnapshot, score: this.score, level: this.level, highScore: this.highScore, linesClearedTotal: this.linesClearedTotal }; }
  public addScore(points: number): void { this.score += points; }
  public setLevel(level: number): void { this.level = level; }
  public setHighScore(hs: number): void { this.highScore = hs; }
  public getHighScore(): number { return this.highScore; }
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }
  public isGameOver(): boolean { return this.gameOver; }
  public getLinesClearedTotal(): number { return this.linesClearedTotal; }
}

describe('Persistence - saveGame & loadGame', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  test('saveGame() เขียนข้อมูลลงไฟล์ JSON ตาม schema ถูกต้อง (สร้างไฟล์ใหม่)', async () => {
    const data: SaveData = {
      version: CURRENT_SAVE_VERSION,
      highScore: 1250,
      level: 3,
      linesCleared: 8,
      timestamp: '2026-09-15T10:00:00.000Z',
    };

    await saveGame(data, TEST_SAVE_FILE);

    expect(fs.existsSync(TEST_SAVE_FILE)).toBe(true);
    const content = fs.readFileSync(TEST_SAVE_FILE, 'utf-8');
    const parsed = JSON.parse(content);

    expect(parsed).toEqual(data);
    expect(validateSaveData(parsed)).toBe(true);
  });

  test('saveGame() ทำการ overwrite ไฟล์เดิมได้อย่างถูกต้อง', async () => {
    const initialData: SaveData = {
      version: CURRENT_SAVE_VERSION,
      highScore: 500,
      level: 1,
      linesCleared: 2,
      timestamp: '2026-09-15T08:00:00.000Z',
    };
    await saveGame(initialData, TEST_SAVE_FILE);

    const updatedData: SaveData = {
      version: CURRENT_SAVE_VERSION,
      highScore: 2500,
      level: 5,
      linesCleared: 15,
      timestamp: '2026-09-15T12:00:00.000Z',
    };
    await saveGame(updatedData, TEST_SAVE_FILE);

    const content = fs.readFileSync(TEST_SAVE_FILE, 'utf-8');
    const parsed = JSON.parse(content);

    expect(parsed).toEqual(updatedData);
    expect(parsed.highScore).toBe(2500);
    expect(parsed.linesCleared).toBe(15);
  });

  test('saveGame() จัดการ error แบบ graceful กรณีเขียนไฟล์ไม่ได้ (เช่น path เป็น directory) โดยไม่ crash', async () => {
    const data: SaveData = {
      version: CURRENT_SAVE_VERSION,
      highScore: 100,
      level: 1,
      linesCleared: 1,
      timestamp: new Date().toISOString(),
    };

    fs.mkdirSync(TEST_DIR, { recursive: true });
    await expect(saveGame(data, TEST_DIR)).resolves.toBeUndefined();
  });

  test('saveGame() จัดการ error จาก Bun I/O แบบ graceful', async () => {
    const data: SaveData = {
      version: CURRENT_SAVE_VERSION,
      highScore: 100,
      level: 1,
      linesCleared: 1,
      timestamp: new Date().toISOString(),
    };

    await expect(saveGame(data, '\0')).resolves.toBeUndefined();
  });

  test('saveGame() จัดการกรณีข้อมูลไม่ตรง schema แบบ graceful โดยไม่ crash', async () => {
    const invalidData = {
      version: 999, // invalid version
      highScore: 'not-a-number',
    } as unknown as SaveData;

    await expect(saveGame(invalidData, TEST_SAVE_FILE)).resolves.toBeUndefined();

    // ต้องไม่สร้างไฟล์ที่มีข้อมูลผิด schema ขึ้นมา
    expect(fs.existsSync(TEST_SAVE_FILE)).toBe(false);
  });

  test('loadGame() สามารถโหลดไฟล์เซฟและตรวจสอบ schema ได้ถูกต้อง', async () => {
    const data: SaveData = {
      version: CURRENT_SAVE_VERSION,
      highScore: 3000,
      level: 6,
      linesCleared: 20,
      timestamp: '2026-09-15T15:00:00.000Z',
    };
    await saveGame(data, TEST_SAVE_FILE);

    const loaded = await loadGame(TEST_SAVE_FILE);
    expect(loaded).not.toBeNull();
    expect(loaded).toEqual(data);
  });

  test('loadGame() คืนค่า null แบบ graceful เมื่อไฟล์ไม่มีอยู่จริง', async () => {
    const loaded = await loadGame('./non-existent-save-file.json');
    expect(loaded).toBeNull();
  });

  test('loadGame() คืนค่า null แบบ graceful เมื่อ path เป็น directory', async () => {
    fs.mkdirSync(TEST_DIR, { recursive: true });

    const loaded = await loadGame(TEST_DIR);
    expect(loaded).toBeNull();
  });

  test('loadGame() คืนค่า null แบบ graceful เมื่อไฟล์เสียหาย (corrupted JSON)', async () => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
    fs.writeFileSync(TEST_SAVE_FILE, '{ corrupted json content', 'utf-8');

    const loaded = await loadGame(TEST_SAVE_FILE);
    expect(loaded).toBeNull();
  });

  test('loadGame() คืนค่า null เมื่อ JSON ถูกต้องแต่ข้อมูลไม่ตรง schema', async () => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
    fs.writeFileSync(TEST_SAVE_FILE, JSON.stringify({
      version: 999,
      highScore: 100,
      level: 1,
      linesCleared: 0,
      timestamp: '2026-09-15T10:00:00.000Z',
    }), 'utf-8');

    const loaded = await loadGame(TEST_SAVE_FILE);
    expect(loaded).toBeNull();
  });

  test('เชื่อมต่อเข้ากับ GameStateLoop: เรียก onSave เมื่อเกิด Game Over และบันทึกสถานะได้ถูกต้อง', async () => {
    let savedDataReceived = null as SaveData | null;
    const engine = new TestEngine();
    engine.score = 900;
    engine.level = 4;
    engine.linesClearedTotal = 12;

    const loop = new GameStateLoop({
      engine,
      onLoad: () => null,
      onSave: async (data) => {
        savedDataReceived = data;
        await saveGame(data, TEST_SAVE_FILE);
      },
    });

    await loop.start();
    // จำลอง Game Over
    engine.gameOver = true;
    loop.tick();
    await loop.triggerSave();

    expect(savedDataReceived).not.toBeNull();
    expect(savedDataReceived?.highScore).toBe(900);
    expect(savedDataReceived?.level).toBe(4);
    expect(savedDataReceived?.linesCleared).toBe(12);

    // ตรวจสอบไฟล์ที่เขียนลง disk
    expect(fs.existsSync(TEST_SAVE_FILE)).toBe(true);
    const diskData = await loadGame(TEST_SAVE_FILE);
    expect(diskData?.highScore).toBe(900);
  });

  test('เชื่อมต่อเข้ากับ GameStateLoop: เรียก onSave เมื่อผู้เล่นกด QUIT', async () => {
    let savedDataReceived = null as SaveData | null;
    const engine = new TestEngine();
    engine.score = 450;
    engine.level = 2;
    engine.linesClearedTotal = 3;

    const loop = new GameStateLoop({
      engine,
      onLoad: () => null,
      onSave: async (data) => {
        savedDataReceived = data;
        await saveGame(data, TEST_SAVE_FILE);
      },
    });

    await loop.start();
    loop.handleAction('QUIT');
    await loop.triggerSave();

    expect(savedDataReceived).not.toBeNull();
    expect(savedDataReceived?.highScore).toBe(450);

    const diskData = await loadGame(TEST_SAVE_FILE);
    expect(diskData?.highScore).toBe(450);
  });

  test('เชื่อมต่อเข้ากับ GameStateLoop: บันทึกข้อมูลอัตโนมัติด้วย default onSave (saveGame) เมื่อไม่ได้ระบุ callback', async () => {
    const engine = new TestEngine();
    engine.score = 1200;
    engine.level = 3;
    engine.linesClearedTotal = 10;

    // ไม่ได้ส่ง onSave แต่ส่ง saveFilePath เข้าไป
    const loop = new GameStateLoop({
      engine,
      saveFilePath: TEST_SAVE_FILE,
    });

    await loop.start();
    loop.handleAction('QUIT');
    await loop.triggerSave();

    expect(fs.existsSync(TEST_SAVE_FILE)).toBe(true);
    const diskData = await loadGame(TEST_SAVE_FILE);
    expect(diskData?.highScore).toBe(1200);
    expect(diskData?.level).toBe(3);
    expect(diskData?.linesCleared).toBe(10);
  });

  test('เชื่อมต่อเข้ากับ GameStateLoop: รองรับ onSave แบบ Async Promise และ triggerSave() ตรง', async () => {
    let asyncSaved = false;
    const engine = new TestEngine();
    engine.score = 770;

    const loop = new GameStateLoop({
      engine: engine as unknown as CoreEngine,
      onLoad: () => null,
      onSave: async (data) => {
        await Promise.resolve();
        asyncSaved = true;
        await saveGame(data, TEST_SAVE_FILE);
      },
    });

    await loop.triggerSave();
    expect(asyncSaved).toBe(true);
    const diskData = await loadGame(TEST_SAVE_FILE);
    expect(diskData?.highScore).toBe(770);
  });
});

