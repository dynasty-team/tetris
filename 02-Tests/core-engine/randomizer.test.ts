// 02-Tests/core-engine/randomizer.test.ts
import { describe, expect, test } from 'bun:test';
import type { TetrominoType } from '../../01-Source-code/shared/types';
import {
  SevenBagRandomizer,
  BagRandomizer,
  createSevenBag,
  TETROMINO_TYPES,
} from '../../01-Source-code/core-engine/randomizer';

describe('7-bag Randomizer (Tetris Guideline Random Generator)', () => {
  describe('Acceptance Criteria: สุ่ม 100+ ครั้ง ต้องคงคุณสมบัติ 7-bag', () => {
    test('สุ่ม 105 ครั้ง (15 ถุง) ทุกๆ ถุง 7 ชิ้นต้องมีครบทั้ง 7 ชนิด (I, O, T, S, Z, J, L) อย่างละ 1 ชิ้น', () => {
      const randomizer = new SevenBagRandomizer();
      const totalPieces = 105; // 15 ถุง x 7 ชิ้น
      const drawnPieces: TetrominoType[] = [];

      for (let i = 0; i < totalPieces; i++) {
        drawnPieces.push(randomizer.next());
      }

      expect(drawnPieces.length).toBe(totalPieces);

      // ตรวจสอบทีละถุง (กลุ่มละ 7 ชิ้น)
      const numBags = totalPieces / 7;
      for (let bagIdx = 0; bagIdx < numBags; bagIdx++) {
        const bag = drawnPieces.slice(bagIdx * 7, (bagIdx + 1) * 7);
        expect(bag.length).toBe(7);

        // ตรวจสอบว่าในถุงมีสมาชิกที่ไม่ซ้ำกันครบ 7 ชนิด
        const uniqueSet = new Set(bag);
        expect(uniqueSet.size).toBe(7);

        // ตรวจสอบว่ามีชิ้นส่วนครบทุกตัวตาม TETROMINO_TYPES
        for (const type of TETROMINO_TYPES) {
          expect(uniqueSet.has(type)).toBe(true);
        }
      }
    });

    test('สุ่ม 100+ ครั้ง ไม่มีชิ้นส่วนชนิดเดียวกันที่อยู่ห่างกันเกิน 12 ใบ (Drought Gap <= 12)', () => {
      const randomizer = new SevenBagRandomizer();
      const totalPieces = 140; // 20 ถุง
      const drawnPieces: TetrominoType[] = [];

      for (let i = 0; i < totalPieces; i++) {
        drawnPieces.push(randomizer.next());
      }

      // ตรวจสอบระยะห่างระหว่างชิ้นส่วนชนิดเดียวกันแต่ละชนิด
      for (const type of TETROMINO_TYPES) {
        const indices: number[] = [];
        for (let i = 0; i < drawnPieces.length; i++) {
          if (drawnPieces[i] === type) {
            indices.push(i);
          }
        }

        // ตรวจสอบช่องว่างระหว่างการปรากฏตัวที่ติดกัน
        for (let k = 0; k < indices.length - 1; k++) {
          const currentIdx = indices[k]!;
          const nextIdx = indices[k + 1]!;
          // จำนวนชิ้นส่วนที่คั่นกลาง (intervening pieces) = nextIdx - currentIdx - 1
          const droughtGap = nextIdx - currentIdx - 1;

          // ตามทฤษฎี 7-bag: กรณีแย่ที่สุดคือชิ้นแรกของถุง N และชิ้นสุดท้ายของถุง N+1
          // -> คั่นด้วย 6 ชิ้นจากถุง N + 6 ชิ้นจากถุง N+1 = 12 ชิ้นพอดี
          expect(droughtGap).toBeLessThanOrEqual(12);
        }
      }
    });

    test('สุ่ม 100+ ครั้ง ชิ้นส่วนเดิมซ้ำติดกันได้สูงสุดไม่เกิน 2 ครั้ง (Streak <= 2)', () => {
      const randomizer = new SevenBagRandomizer();
      const totalPieces = 140;
      const drawnPieces: TetrominoType[] = [];

      for (let i = 0; i < totalPieces; i++) {
        drawnPieces.push(randomizer.next());
      }

      let currentStreak = 1;
      let maxStreak = 1;

      for (let i = 1; i < drawnPieces.length; i++) {
        if (drawnPieces[i] === drawnPieces[i - 1]) {
          currentStreak++;
          if (currentStreak > maxStreak) {
            maxStreak = currentStreak;
          }
        } else {
          currentStreak = 1;
        }
      }

      // ใน 7-bag ชิ้นซ้ำติดกันจะเกิดขึ้นได้เฉพาะรอยต่อระหว่าง 2 ถุงเท่านั้น (มากสุด 2 ตัวติด)
      expect(maxStreak).toBeLessThanOrEqual(2);
    });
  });

  describe('ถุงสับจริงด้วย Fisher-Yates (ไม่ fix ลำดับตายตัว)', () => {
    test('สุ่มหลายรอบ ลำดับของชิ้นส่วนต้องไม่ซ้ำกันแบบ hardcoded', () => {
      const randomizer1 = new SevenBagRandomizer();
      const randomizer2 = new SevenBagRandomizer();

      const sequence1: TetrominoType[] = [];
      const sequence2: TetrominoType[] = [];

      // ดึง 14 ชิ้น (2 ถุง) เพื่อเปรียบเทียบลำดับ
      for (let i = 0; i < 14; i++) {
        sequence1.push(randomizer1.next());
        sequence2.push(randomizer2.next());
      }

      // โอกาสที่ 14 ชิ้นจาก Fisher-Yates 2 instance จะออกมาเหมือนกันเป๊ะคือ 1/(5040^2) ซึ่งแทบเป็นศูนย์
      const isIdentical = sequence1.every((piece, idx) => piece === sequence2[idx]);
      expect(isIdentical).toBe(false);
    });

    test('createSevenBag() คืน array 7 ชิ้นที่มี Tetromino ครบทุกแบบ', () => {
      const bag = createSevenBag();
      expect(bag.length).toBe(7);
      const set = new Set(bag);
      expect(set.size).toBe(7);
      for (const type of TETROMINO_TYPES) {
        expect(set.has(type)).toBe(true);
      }
    });

    test('รองรับ Custom Shuffle Function (Dependency Injection)', () => {
      // Mock shuffle แบบ reverse แทนการสุ่ม
      const reverseShuffle = <T>(items: readonly T[]): T[] => [...items].reverse();

      const randomizer = new SevenBagRandomizer(reverseShuffle);
      const expectedBag = [...TETROMINO_TYPES].reverse();

      for (const expectedPiece of expectedBag) {
        expect(randomizer.next()).toBe(expectedPiece);
      }
    });
  });

  describe('เมธอดเสริมและการทำงานของ Randomizer Class', () => {
    test('peek() ดูชิ้นถัดไปได้โดยไม่หยิบออกจากถุง', () => {
      const randomizer = new SevenBagRandomizer();
      const peekedPiece = randomizer.peek();
      const remainingBefore = randomizer.remainingInBag;

      // peek() ไม่ควรทำให้จำนวนชิ้นลดลง
      expect(randomizer.remainingInBag).toBe(remainingBefore);

      // เมื่อเรียก next() ต้องได้ชิ้นเดียวกับที่ peek() ไว้
      const nextPiece = randomizer.next();
      expect(nextPiece).toBe(peekedPiece);
      expect(randomizer.remainingInBag).toBe(remainingBefore - 1);
    });

    test('peekQueue(n) สามารถดูคิวล่วงหน้าหลายชิ้นได้ถูกต้อง', () => {
      const randomizer = new SevenBagRandomizer();
      const previewCount = 5;
      const preview = randomizer.peekQueue(previewCount);

      expect(preview.length).toBe(previewCount);

      // ชิ้นส่วนที่ดึงด้วย next() ต้องตรงตามคิวที่ preview ไว้
      for (let i = 0; i < previewCount; i++) {
        expect(randomizer.next()).toBe(preview[i]!);
      }
    });

    test('reset() รีเซ็ตถุงสุ่มใหม่และมีชิ้นส่วนครบ 7 ชิ้น', () => {
      const randomizer = new SevenBagRandomizer();
      randomizer.next();
      randomizer.next();
      expect(randomizer.remainingInBag).toBe(5);

      randomizer.reset();
      expect(randomizer.remainingInBag).toBe(7);
    });

    test('BagRandomizer alias ชี้ไปยัง SevenBagRandomizer', () => {
      expect(BagRandomizer).toBe(SevenBagRandomizer);
      const instance = new BagRandomizer();
      expect(instance).toBeInstanceOf(SevenBagRandomizer);
    });
  });
});
