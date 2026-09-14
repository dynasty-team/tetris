import type { ActionResult } from '../shared/types';




export function calculateScore(linesCleared: number, level: number): number {
  // ดัก level ขั้นต่ำ 1 และปัดเศษ
  const safeLevel = !Number.isFinite(level) || level < 1 ? 1 : Math.floor(level);

  const BASE_SCORE = 100;

  // โบนัสตามจำนวนแถวที่เคลียร์ (1, 2, 3, 4 แถว)
  const lineBonus: Record<number, number> = {
    1: 1,
    2: 2.5,
    3: 4.5,
    4: 8,
  };

  const bonus = lineBonus[linesCleared] ?? 0;

  return Math.round(BASE_SCORE * bonus * safeLevel);
}

/**
 * คำนวณคะแนนที่ได้จากผลลัพธ์การกระทำ (ActionResult)
 * โดยจะนับจำนวนแถวที่เคลียร์จาก result.linesCleared.length
 */
export function getScoreFromActionResult(result: ActionResult, level: number): number {
  if (!result.linesCleared || result.linesCleared.length === 0) {
    return 0;
  }
  return calculateScore(result.linesCleared.length, level);
}