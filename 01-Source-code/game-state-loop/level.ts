/**
 * คำนวณ level: เริ่มที่ level 1 และเพิ่ม 1 level ทุกๆ 10 แถว
 */
export function calculateLevel(totalLinesCleared: number): number {
      return Math.floor(Math.max(0, totalLinesCleared) / 10) + 1;
}

/**
 * คำนวณความเร็ว (ms):
 * เริ่มที่ 1000ms และลดลง 100ms ต่อ level
 * มี Math.max(100, ...) เป็น lower bound ไม่ให้เร็วกว่า 100ms
 */
export function getSpeedForLevel(level: number): number {
      return Math.max(100, 1000 - (Math.max(1, level) - 1) * 100);
}
