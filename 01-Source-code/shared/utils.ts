// 01-Source-code/shared/utils.ts
//
// Higher-order function กลางของโปรเจกต์ — ใช้ตอบโจทย์ FP requirement (Pure Function, Higher-order)
// pipe() คือฟังก์ชันที่ "รับฟังก์ชันหลายตัวเป็น argument แล้วคืนฟังก์ชันใหม่"
// นี่คือ higher-order function ของจริง (ต่างจาก pure function ธรรมดาที่แค่รับ/คืนค่า)

/**
 * ประกอบฟังก์ชันหลายตัวเข้าด้วยกัน เรียกตามลำดับซ้ายไปขวา
 * ใช้ตอน core-engine lock piece: pipe(lockPieceToBoard, clearFullLines, spawnNextPiece)
 * แทนการเขียน if-else ต่อกันยาวๆ
 *
 * @example
 * const addOne = (x: number) => x + 1;
 * const double = (x: number) => x * 2;
 * const addThenDouble = pipe(addOne, double);
 * addThenDouble(3); // => 8  ( (3+1) * 2 )
 */
export function pipe<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (arg: T) => fns.reduce((acc, fn) => fn(acc), arg);
}

/**
 * สลับลำดับ array แบบสุ่มด้วย Fisher-Yates shuffle
 * ใช้ทำ 7-bag randomizer ใน core-engine (C5) — ห้ามใช้ Math.random() ล้วนๆ แบบ sort
 * เพราะ sort-based shuffle ไม่ uniform จริง
 */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i]!;
    result[i] = result[j]!;
    result[j] = temp;
  }
  return result;
}
