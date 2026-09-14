import { describe, test, expect } from 'bun:test';
import { TetrisEngine } from '../../01-Source-code/core-engine/TetrisEngine';

describe('TetrisEngine - Score/Level Setters', () => {
  test('addScore() เพิ่มคะแนนสะสมถูกต้อง เรียกซ้ำได้', () => {
    const engine = new TetrisEngine();
    engine.addScore(100);
    engine.addScore(300);
    expect(engine.getScore()).toBe(400);
  });

  test('addScore() ไม่รับค่าติดลบหรือ NaN', () => {
    const engine = new TetrisEngine();
    engine.addScore(-50);
    engine.addScore(NaN);
    expect(engine.getScore()).toBe(0);
  });

  test('setLevel() กำหนด level ได้ และไม่ต่ำกว่า 1', () => {
    const engine = new TetrisEngine();
    engine.setLevel(5);
    expect(engine.getLevel()).toBe(5);
    engine.setLevel(0);
    expect(engine.getLevel()).toBe(1);
  });

  test('setLevel() ไม่รับค่า NaN/Infinity', () => {
    const engine = new TetrisEngine();
    engine.setLevel(NaN);
    expect(engine.getLevel()).toBe(1);
  });

  test('getLinesClearedTotal() คืนค่าตรงกับ RenderSnapshot', () => {
    const engine = new TetrisEngine();
    expect(engine.getLinesClearedTotal()).toBe(engine.getRenderSnapshot().linesClearedTotal);
  });
});
