// 02-Tests/persistence/save-load.test.ts

import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { saveGame, loadGame, SaveManager, validateSaveData, CURRENT_SAVE_VERSION } from '../../01-Source-code/persistence';
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

  public moveLeft(): ActionResult { return { success: true, linesCleared: [], gameOver: this.gameOver }; }
  public moveRight(): ActionResult { return { success: true, linesCleared: [], gameOver: this.gameOver }; }
  public softDrop(): ActionResult { return { success: true, linesCleared: [], gameOver: this.gameOver }; }
  public rotate(): ActionResult { return { success: true, linesCleared: [], gameOver: this.gameOver }; }
  public hardDrop(): ActionResult { return { success: true, linesCleared: [], gameOver: this.gameOver }; }
  public tick(): ActionResult { return { success: true, linesCleared: [], gameOver: this.gameOver }; }
  public spawnNextPiece(): ActionResult { return { success: true, linesCleared: [], gameOver: this.gameOver }; }
  public getRenderSnapshot(): RenderSnapshot {
    return {
      ...mockRenderSnapshot,
      score: this.score,
      level: this.level,
      linesClearedTotal: this.linesClearedTotal,
      status: this.gameOver ? 'gameover' : 'playing',
    };
  }
  public getHighScore(): number { return this.highScore; }
  public setHighScore(hs: number): void { this.highScore = hs; }
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }
  public isGameOver(): boolean { return this.gameOver; }
  public addScore(points: number): void { this.score += points; }
  public setLevel(lvl: number): void { this.level = lvl; }
  public getLinesClearedTotal(): number { return this.linesClearedTotal; }
}

describe('Persistence - saveGame & SaveManager', () => {
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

  test('saveGame() เขียนข้อมูลลงไฟล์ JSON ตาม schema ถูกต้อง (สร้างไฟล์ใหม่)', () => {
    const data: SaveData = {
      version: CURRENT_SAVE_VERSION,
      highScore: 1250,
      level: 3,
      linesCleared: 8,
      timestamp: '2026-09-15T10:00:00.000Z',
    };

    saveGame(data, TEST_SAVE_FILE);

    expect(fs.existsSync(TEST_SAVE_FILE)).toBe(true);
    const content = fs.readFileSync(TEST_SAVE_FILE, 'utf-8');
    const parsed = JSON.parse(content);

    expect(parsed).toEqual(data);
    expect(validateSaveData(parsed)).toBe(true);
  });

  test('saveGame() ทำการ overwrite ไฟล์เดิมได้อย่างถูกต้อง', () => {
    const initialData: SaveData = {
      version: CURRENT_SAVE_VERSION,
      highScore: 500,
      level: 1,
      linesCleared: 2,
      timestamp: '2026-09-15T08:00:00.000Z',
    };
    saveGame(initialData, TEST_SAVE_FILE);

    const updatedData: SaveData = {
      version: CURRENT_SAVE_VERSION,
      highScore: 2500,
      level: 5,
      linesCleared: 15,
      timestamp: '2026-09-15T12:00:00.000Z',
    };
    saveGame(updatedData, TEST_SAVE_FILE);

    const content = fs.readFileSync(TEST_SAVE_FILE, 'utf-8');
    const parsed = JSON.parse(content);

    expect(parsed).toEqual(updatedData);
    expect(parsed.highScore).toBe(2500);
    expect(parsed.linesCleared).toBe(15);
  });

  test('saveGame() จัดการ error แบบ graceful กรณีเขียนไฟล์ไม่ได้ (เช่น path เป็น directory) โดยไม่ crash', () => {
    const data: SaveData = {
      version: CURRENT_SAVE_VERSION,
      highScore: 100,
      level: 1,
      linesCleared: 1,
      timestamp: new Date().toISOString(),
    };

    fs.mkdirSync(TEST_DIR, { recursive: true });
    expect(() => {
      saveGame(data, TEST_DIR);
    }).not.toThrow();
  });

  test('saveGame() จัดการกรณีข้อมูลไม่ตรง schema แบบ graceful โดยไม่ crash', () => {
    const invalidData = {
      version: 999, // invalid version
      highScore: 'not-a-number',
    } as unknown as SaveData;

    expect(() => {
      saveGame(invalidData, TEST_SAVE_FILE);
    }).not.toThrow();

    // ต้องไม่สร้างไฟล์ที่มีข้อมูลผิด schema ขึ้นมา
    expect(fs.existsSync(TEST_SAVE_FILE)).toBe(false);
  });

  test('loadGame() สามารถโหลดไฟล์เซฟและตรวจสอบ schema ได้ถูกต้อง', () => {
    const data: SaveData = {
      version: CURRENT_SAVE_VERSION,
      highScore: 3000,
      level: 6,
      linesCleared: 20,
      timestamp: '2026-09-15T15:00:00.000Z',
    };
    saveGame(data, TEST_SAVE_FILE);

    const loaded = loadGame(TEST_SAVE_FILE);
    expect(loaded).not.toBeNull();
    expect(loaded).toEqual(data);
  });

  test('loadGame() คืนค่า null แบบ graceful เมื่อไฟล์ไม่มีอยู่จริง', () => {
    const loaded = loadGame('./non-existent-save-file.json');
    expect(loaded).toBeNull();
  });

  test('loadGame() คืนค่า null แบบ graceful เมื่อไฟล์เสียหาย (corrupted JSON)', () => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
    fs.writeFileSync(TEST_SAVE_FILE, '{ corrupted json content', 'utf-8');

    const loaded = loadGame(TEST_SAVE_FILE);
    expect(loaded).toBeNull();
  });

  test('SaveManager class ใช้งานได้ทั้ง instance และ static methods', () => {
    const manager = new SaveManager(TEST_SAVE_FILE);
    const data: SaveData = {
      version: CURRENT_SAVE_VERSION,
      highScore: 800,
      level: 2,
      linesCleared: 4,
      timestamp: '2026-09-15T14:00:00.000Z',
    };

    manager.save(data);
    expect(fs.existsSync(TEST_SAVE_FILE)).toBe(true);

    const loaded = manager.load();
    expect(loaded).toEqual(data);

    // Static methods
    SaveManager.saveGame(data, TEST_SAVE_FILE);
    const loadedStatic = SaveManager.loadGame(TEST_SAVE_FILE);
    expect(loadedStatic).toEqual(data);
  });

  test('เชื่อมต่อเข้ากับ GameStateLoop: เรียก onSave เมื่อเกิด Game Over และบันทึกสถานะได้ถูกต้อง', () => {
    let savedDataReceived = null as SaveData | null;
    const engine = new TestEngine();
    engine.score = 900;
    engine.level = 4;
    engine.linesClearedTotal = 12;

    const loop = new GameStateLoop({
      engine,
      onLoad: () => null,
      onSave: (data) => {
        savedDataReceived = data;
        saveGame(data, TEST_SAVE_FILE);
      },
    });

    loop.start();
    // จำลอง Game Over
    engine.gameOver = true;
    loop.tick();

    expect(savedDataReceived).not.toBeNull();
    expect(savedDataReceived?.highScore).toBe(900);
    expect(savedDataReceived?.level).toBe(4);
    expect(savedDataReceived?.linesCleared).toBe(12);

    // ตรวจสอบไฟล์ที่เขียนลง disk
    expect(fs.existsSync(TEST_SAVE_FILE)).toBe(true);
    const diskData = loadGame(TEST_SAVE_FILE);
    expect(diskData?.highScore).toBe(900);
  });

  test('เชื่อมต่อเข้ากับ GameStateLoop: เรียก onSave เมื่อผู้เล่นกด QUIT', () => {
    let savedDataReceived = null as SaveData | null;
    const engine = new TestEngine();
    engine.score = 450;
    engine.level = 2;
    engine.linesClearedTotal = 3;

    const loop = new GameStateLoop({
      engine,
      onLoad: () => null,
      onSave: (data) => {
        savedDataReceived = data;
        saveGame(data, TEST_SAVE_FILE);
      },
    });

    loop.start();
    loop.handleAction('QUIT');

    expect(savedDataReceived).not.toBeNull();
    expect(savedDataReceived?.highScore).toBe(450);

    const diskData = loadGame(TEST_SAVE_FILE);
    expect(diskData?.highScore).toBe(450);
  });

  test('เชื่อมต่อเข้ากับ GameStateLoop: บันทึกข้อมูลอัตโนมัติด้วย default onSave (saveGame) เมื่อไม่ได้ระบุ callback', () => {
    const engine = new TestEngine();
    engine.score = 1200;
    engine.level = 3;
    engine.linesClearedTotal = 10;

    // ไม่ได้ส่ง onSave แต่ส่ง saveFilePath เข้าไป
    const loop = new GameStateLoop({
      engine,
      saveFilePath: TEST_SAVE_FILE,
    });

    loop.start();
    loop.handleAction('QUIT');

    expect(fs.existsSync(TEST_SAVE_FILE)).toBe(true);
    const diskData = loadGame(TEST_SAVE_FILE);
    expect(diskData?.highScore).toBe(1200);
    expect(diskData?.level).toBe(3);
    expect(diskData?.linesCleared).toBe(10);
  });

  test('เชื่อมต่อเข้ากับ GameStateLoop: รองรับ onSave แบบ Async Promise และ triggerSave() ตรง', async () => {
    let asyncSaved = false;
    const engine = new TestEngine();
    engine.score = 770;

    const loop = new GameStateLoop({
      engine,
      onLoad: () => null,
      onSave: async (data) => {
        await Promise.resolve();
        asyncSaved = true;
        saveGame(data, TEST_SAVE_FILE);
      },
    });

    loop.triggerSave();
    await new Promise((r) => setTimeout(r, 10));

    expect(asyncSaved).toBe(true);
    const diskData = loadGame(TEST_SAVE_FILE);
    expect(diskData?.highScore).toBe(770);
  });
});

