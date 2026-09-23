// 02-Tests/sample.test.ts
//
// ไฟล์นี้มีไว้ยืนยันว่า `bun test` เจอไฟล์และ config ทำงานถูกต้อง (Issue Q1)
// ลบทิ้งได้เมื่อมี integration test จริงจาก Q2 มาแทนที่แล้ว

import { describe, expect, test } from 'bun:test';

describe('bun test config sanity check', () => {
  test('bun test runner ทำงานได้จริง', () => {
    expect(1 + 1).toBe(2);
  });

  test('รองรับ async', async () => {
    const result = await Promise.resolve('ok');
    expect(result).toBe('ok');
  });
});
