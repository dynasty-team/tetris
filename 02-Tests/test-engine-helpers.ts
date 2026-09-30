// 02-Tests/test-engine-helpers.ts
//
// Test helpers และ test extensions สำหรับ TetrisEngine
// ย้ายมาจาก 01-Source-code/core-engine/TetrisEngine.ts เนื่องจากไม่มีการอ้างอิงใน source ของแอป

import { TetrisEngine } from '../01-Source-code/core-engine/TetrisEngine';
import type { Board, TetrominoType } from '../01-Source-code/shared/types';
import type { SevenBagRandomizer } from '../01-Source-code/core-engine/randomizer';

/** ดึงสำเนากระดานปัจจุบันของ engine สำหรับการ assert ในชุดทดสอบ */
export function getBoard(engine: TetrisEngine): Board {
  return engine.getRenderSnapshot().board;
}

/** ดึงชิ้นส่วนถัดไปในคิวของ engine สำหรับการ assert ในชุดทดสอบ */
export function getNextPiece(engine: TetrisEngine): TetrominoType {
  return engine.getRenderSnapshot().nextPiece;
}

/** ดึง 7-bag randomizer ของ engine สำหรับการ assert ในชุดทดสอบ */
export function getRandomizer(engine: TetrisEngine): SevenBagRandomizer {
  return (engine as unknown as { randomizer: SevenBagRandomizer }).randomizer;
}

// Module augmentation สำหรับให้ชุดทดสอบเรียก methods เหล่านี้ได้เฉพาะใน context ของ 02-Tests
declare module '../01-Source-code/core-engine/TetrisEngine' {
  interface TetrisEngine {
    readonly board: Board;
    getBoard(): Board;
    getNextPiece(): TetrominoType;
    getRandomizer(): SevenBagRandomizer;
  }
}

Object.defineProperty(TetrisEngine.prototype, 'board', {
  get(this: TetrisEngine): Board {
    return this.getRenderSnapshot().board;
  },
  configurable: true,
});

TetrisEngine.prototype.getBoard = function (this: TetrisEngine): Board {
  return this.getRenderSnapshot().board;
};

TetrisEngine.prototype.getNextPiece = function (this: TetrisEngine): TetrominoType {
  return this.getRenderSnapshot().nextPiece;
};

TetrisEngine.prototype.getRandomizer = function (this: TetrisEngine): SevenBagRandomizer {
  return (this as unknown as { randomizer: SevenBagRandomizer }).randomizer;
};
