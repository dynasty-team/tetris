export function calculateScore(linesCleared: number,level: number): number {
    
  const BASE_SCORE = 100;
  // กำหนดโบนัสตามจำนวนแถวที่เคลียร์
  const lineBonus: Record<number, number> = {
    1: 1,
    2: 2.5,
    3: 4.5,
    4: 8,
  };

  const bonus = lineBonus[linesCleared] ?? 0;

  // สูตรคะแนน:
  // Score = Base Score × Line Bonus × Level
  //
  // เคลียร์หลายแถวพร้อมกันจะได้โบนัสมากขึ้น
  // และเมื่อ Level สูงขึ้น คะแนนก็จะเพิ่มขึ้นตามความยากของเกม
  return Math.round(BASE_SCORE * bonus * level);
}