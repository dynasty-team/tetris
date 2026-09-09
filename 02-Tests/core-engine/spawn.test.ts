// 02-Tests/core-engine/spawn.test.ts
import { describe, expect, test } from 'bun:test';
import type { Board, TetrominoType } from '../../01-Source-code/shared/types';
import { createEmptyBoard, setCell } from '../../01-Source-code/shared/board-utils';
import {
  TetrisEngine,
  spawnNextPiece,
  DEFAULT_SPAWN_POSITION,
} from '../../01-Source-code/core-engine/TetrisEngine';
import { SevenBagRandomizer } from '../../01-Source-code/core-engine/randomizer';

describe('spawnNextPiece() - ระบบสร้างชิ้นส่วนใหม่และตรวจจับ Game Over', () => {
  describe('กรณีเกิดสำเร็จบนกระดานว่าง (Normal Spawning)', () => {
    test('ก่อน spawn activePiece จะเป็น null', () => {
      const engine = new TetrisEngine();
      expect(engine.getActivePiece()).toBeNull();
      expect(engine.getScore()).toBe(0);
      expect(engine.getLevel()).toBe(1);
      expect(engine.getBoard().length).toBe(20);
      expect(engine.getRandomizer()).toBeInstanceOf(SevenBagRandomizer);
    });

    test('spawn piece บน empty board คืน success: true, gameOver: false', () => {
      const engine = new TetrisEngine();
      const result = engine.spawnNextPiece();

      expect(result.success).toBe(true);
      expect(result.gameOver).toBe(false);
      expect(result.linesCleared).toEqual([]);

      // ชิ้นส่วน activePiece ต้องถูกสร้างขึ้นและวางที่ตำแหน่ง spawn มาตรฐาน { x: 3, y: 0 }
      const activePiece = engine.getActivePiece();
      expect(activePiece).not.toBeNull();
      expect(activePiece?.position).toEqual(DEFAULT_SPAWN_POSITION);
      expect(activePiece?.rotation).toBe(0);
      expect(engine.isGameOver()).toBe(false);
    });

    test('nextPiece ถูกอัปเดตอย่างต่อเนื่องหลังจาก spawn', () => {
      const engine = new TetrisEngine();
      const firstNext = engine.getNextPiece();
      expect(firstNext).not.toBeNull();

      // เมื่อเรียก spawn ชิ้นส่วนใน nextPiece จะกลายเป็น activePiece
      const result = engine.spawnNextPiece();
      expect(result.success).toBe(true);

      const activePiece = engine.getActivePiece();
      expect(activePiece?.type).toBe(firstNext);

      // nextPiece จะต้องถูกเลื่อนเป็นชิ้นถัดไปจาก 7-bag
      const secondNext = engine.getNextPiece();
      expect(secondNext).not.toBeNull();
    });

    test('getRenderSnapshot() สะท้อน activePiece และ nextPiece ที่ spawn แล้วอย่างถูกต้อง', () => {
      const engine = new TetrisEngine();
      engine.spawnNextPiece();

      const snapshot = engine.getRenderSnapshot();
      expect(snapshot.status).toBe('playing');
      expect(snapshot.activePiece.position).toEqual(DEFAULT_SPAWN_POSITION);
      expect(snapshot.nextPiece).toBeDefined();
    });
  });

  describe('กรณีชนทันทีตั้งแต่จุดเกิด -> Game Over (Spawn Collision / Lock Out)', () => {
    test('มีบล็อกวางทับที่ตำแหน่ง spawn ด้านบนกระดาน -> gameOver: true และ success: false', () => {
      // สร้าง deterministic randomizer ให้ได้ชิ้น T เป็นชิ้นแรก
      const fixedShuffle = <T>(items: readonly T[]): T[] => {
        // วาง 'T' ไว้ตัวแรก
        const list = [...items];
        const tIndex = list.indexOf('T' as unknown as T);
        if (tIndex !== -1) {
          const temp = list[0]!;
          list[0] = list[tIndex]!;
          list[tIndex] = temp;
        }
        return list;
      };

      const customRandomizer = new SevenBagRandomizer(fixedShuffle);
      const engine = new TetrisEngine(customRandomizer);

      // T piece ที่ spawn (rot 0) มีบล็อกอยู่ที่ bounding box:
      // row 0 col 1 -> (3 + 1, 0 + 0) = (4, 0)
      // row 1 cols 0, 1, 2 -> (3, 1), (4, 1), (5, 1)
      // วางบล็อกกีดขวางที่ตำแหน่ง (4, 0) บนกระดาน
      let blockedBoard = createEmptyBoard();
      blockedBoard = setCell(blockedBoard, 4, 0, 'I');
      engine.setBoard(blockedBoard);

      const result = engine.spawnNextPiece();

      expect(result.success).toBe(false);
      expect(result.gameOver).toBe(true);
      expect(result.linesCleared).toEqual([]);
      expect(engine.isGameOver()).toBe(true);

      // Snapshot ต้องระบุสถานะเป็น gameover
      const snapshot = engine.getRenderSnapshot();
      expect(snapshot.status).toBe('gameover');
    });

    test('บล็อกกองสูงถึงแถวบนสุดจน I piece ไม่สามารถ spawn ได้', () => {
      // สร้าง deterministic randomizer ให้ได้ชิ้น I เป็นชิ้นแรก
      const fixedShuffle = <T>(items: readonly T[]): T[] => {
        const list = [...items];
        const iIndex = list.indexOf('I' as unknown as T);
        if (iIndex !== -1) {
          const temp = list[0]!;
          list[0] = list[iIndex]!;
          list[iIndex] = temp;
        }
        return list;
      };

      const customRandomizer = new SevenBagRandomizer(fixedShuffle);
      const engine = new TetrisEngine(customRandomizer);

      // I piece spawn (rot 0): row 1 มีบล็อกที่ col 0, 1, 2, 3 -> (3, 1), (4, 1), (5, 1), (6, 1)
      let blockedBoard = createEmptyBoard();
      blockedBoard = setCell(blockedBoard, 5, 1, 'O');
      engine.setBoard(blockedBoard);

      const result = engine.spawnNextPiece();

      expect(result.success).toBe(false);
      expect(result.gameOver).toBe(true);
      expect(engine.isGameOver()).toBe(true);
    });

    test('เมื่อ gameOver: true แล้ว การเรียก spawnNextPiece() ซ้ำยังคงคืน gameOver: true', () => {
      let blockedBoard = createEmptyBoard();
      // ขวางแถวที่ 0 และ 1 ทั้งแถว
      for (let x = 0; x < 10; x++) {
        blockedBoard = setCell(blockedBoard, x, 0, 'X' as unknown as TetrominoType);
        blockedBoard = setCell(blockedBoard, x, 1, 'X' as unknown as TetrominoType);
      }

      const engine = new TetrisEngine(undefined, blockedBoard);
      const firstResult = engine.spawnNextPiece();
      expect(firstResult.gameOver).toBe(true);

      const secondResult = engine.spawnNextPiece();
      expect(secondResult.gameOver).toBe(true);
      expect(secondResult.success).toBe(false);
    });
  });

  describe('Standalone Helper spawnNextPiece()', () => {
    test('สามารถเรียก spawnNextPiece(engine) ได้อย่างถูกต้อง', () => {
      const engine = new TetrisEngine();
      const result = spawnNextPiece(engine);

      expect(result.success).toBe(true);
      expect(result.gameOver).toBe(false);
    });

    test('สามารถเรียก spawnNextPiece() แบบไม่ส่ง engine (สร้าง default instance) ได้', () => {
      const result = spawnNextPiece();

      expect(result.success).toBe(true);
      expect(result.gameOver).toBe(false);
    });
  });
});
