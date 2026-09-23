import { describe, expect, test } from 'bun:test';
import { validateSaveData, CURRENT_SAVE_VERSION } from '../../01-Source-code/persistence/schema';
import type { SaveData } from '../../01-Source-code/shared/types';

describe('validateSaveData() - Schema Validation', () => {
  const validSaveData: SaveData = {
    version: CURRENT_SAVE_VERSION,
    highScore: 1000,
    level: 1,
    linesCleared: 4,
    timestamp: '2026-09-15T10:00:00.000Z',
  };

  // 1. data เป็น non-object (null, undefined, "string", []) -> false
  describe('1. data เป็น non-object (null, undefined, "string", []) -> false', () => {
    test('validateSaveData(null) -> false', () => {
      expect(validateSaveData(null)).toBe(false);
    });

    test('validateSaveData(undefined) -> false', () => {
      expect(validateSaveData(undefined)).toBe(false);
    });

    test('validateSaveData("string") -> false', () => {
      expect(validateSaveData('string')).toBe(false);
    });

    test('validateSaveData([]) -> false', () => {
      expect(validateSaveData([])).toBe(false);
    });

    test('data เป็น primitive อื่นๆ (number, boolean, symbol) -> false', () => {
      expect(validateSaveData(123)).toBe(false);
      expect(validateSaveData(true)).toBe(false);
      expect(validateSaveData(Symbol('test'))).toBe(false);
    });
  });

  // 2. object ที่มี version ผิด (เช่น 0, 2, "1") -> false
  describe('2. object ที่มี version ผิด (เช่น 0, 2, "1") -> false', () => {
    test('version เป็น 0 -> false', () => {
      expect(validateSaveData({ ...validSaveData, version: 0 })).toBe(false);
    });

    test('version เป็น 2 -> false', () => {
      expect(validateSaveData({ ...validSaveData, version: 2 })).toBe(false);
    });

    test('version เป็น "1" (string) -> false', () => {
      expect(validateSaveData({ ...validSaveData, version: '1' })).toBe(false);
    });

    test('version เป็นค่าอื่นๆ ที่ไม่ตรงกับ CURRENT_SAVE_VERSION -> false', () => {
      expect(validateSaveData({ ...validSaveData, version: 999 })).toBe(false);
      expect(validateSaveData({ ...validSaveData, version: -1 })).toBe(false);
      expect(validateSaveData({ ...validSaveData, version: null })).toBe(false);
    });
  });

  // 3. object ที่ขาด field ใดๆ ไปทีละตัว -> false
  describe('3. object ที่ขาด field ใดๆ ไปทีละตัว -> false', () => {
    const fields: (keyof SaveData)[] = ['version', 'highScore', 'level', 'linesCleared', 'timestamp'];

    for (const field of fields) {
      test(`ขาด field "${field}" -> false`, () => {
        const copy: Record<string, unknown> = { ...validSaveData };
        delete copy[field];
        expect(validateSaveData(copy)).toBe(false);
      });
    }
  });

  // 4. object ที่ field ผิด type ทีละตัว (loop ทดสอบทุก field) -> false
  describe('4. object ที่ field ผิด type ทีละตัว (loop ทดสอบทุก field) -> false', () => {
    const wrongTypeCases: { field: keyof SaveData; invalidValues: unknown[] }[] = [
      { field: 'version', invalidValues: ['1', null, true, {}, []] },
      { field: 'highScore', invalidValues: ['1000', null, true, {}, []] },
      { field: 'level', invalidValues: ['1', null, false, {}, []] },
      { field: 'linesCleared', invalidValues: ['4', null, true, {}, []] },
      { field: 'timestamp', invalidValues: [1726390000000, null, true, {}, new Date()] },
    ];

    for (const { field, invalidValues } of wrongTypeCases) {
      for (const invalidValue of invalidValues) {
        const typeLabel = invalidValue === null ? 'null' : Array.isArray(invalidValue) ? 'array' : typeof invalidValue;
        test(`field "${field}" มี type ผิด (${typeLabel}) -> false`, () => {
          const copy: Record<string, unknown> = { ...validSaveData, [field]: invalidValue };
          expect(validateSaveData(copy)).toBe(false);
        });
      }
    }
  });

  // 5. object ที่ถูกต้องครบทุกอย่าง -> true (happy path)
  describe('5. object ที่ถูกต้องครบทุกอย่าง -> true (happy path)', () => {
    test('validateSaveData(validSaveData) -> true', () => {
      expect(validateSaveData(validSaveData)).toBe(true);
    });

    test('validateSaveData กับ boundary value (ค่าตัวเลขเป็น 0) -> true', () => {
      const zeroData: SaveData = {
        version: CURRENT_SAVE_VERSION,
        highScore: 0,
        level: 0,
        linesCleared: 0,
        timestamp: '2026-09-15T00:00:00.000Z',
      };
      expect(validateSaveData(zeroData)).toBe(true);
    });
  });
});

