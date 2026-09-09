// 01-Source-code/core-engine/randomizer.ts
//
// ============================================================================
// ทำไมถึงเลือกใช้ระบบ 7-bag Randomizer (Random Generator ตาม Tetris Guideline)?
// ============================================================================
//
// ในการพัฒนาเกม Tetris หากใช้การสุ่มแบบตรงไปตรงมา (Pure Random เช่น Math.random() ล้วนๆ)
// จะเกิดปัญหาเชิง Game Design และความยุติธรรมของผู้เล่นอย่างรุนแรง 2 ประการ:
//
// 1. ปัญหาชิ้นส่วนขาดแคลน (Piece Drought):
//    - การสุ่มอิสระ (Independent Random Selection) อาจทำให้ผู้เล่นไม่ได้รับชิ้นส่วนที่ต้องการ
//      (เช่น แท่งยาว 'I' ซึ่งจำเป็นมากในการทำคะแนนระดับ Tetris และเคลียร์กระดานสูง) ติดต่อกัน
//      ยาวนานถึง 20-30+ ชิ้น ส่งผลให้ผู้เล่นกระดานเต็มและแพ้เกมอย่างไม่เป็นธรรม (Unavoidable Game Over)
//      โดยไม่ใช่ความผิดพลาดในการตัดสินใจของผู้เล่น
//    - ในระบบ 7-bag การันตีว่าชิ้นส่วนเดียวกันจะทิ้งช่วงห่างกันได้ "สูงสุดไม่เกิน 12 ชิ้น" เสมอ!
//      (กรณีแย่ที่สุด: ชิ้นนั้นอยู่ลำดับที่ 1 ของถุงแรก และอยู่ลำดับที่ 7 ของถุงถัดไป
//      -> 1 + [6 ชิ้นที่เหลือ] + [6 ชิ้นของถุงสอง] + 1 -> ห่างกัน 12 ชิ้น)
//      ผู้เล่นจึงมั่นใจได้ว่าจะได้รับชิ้นส่วนสำคัญอย่างสม่ำเสมอ สามารถวางแผนล่วงหน้าได้
//
// 2. ปัญหาชิ้นส่วนซ้ำซ้อนติดกันมากเกินไป (Piece Flood / Streaks):
//    - การสุ่มอิสระอาจทำให้เกิดชิ้นส่วนเดิมซ้ำติดกัน 3, 4 หรือ 5 ชิ้น (เช่น ได้ Z ติดกัน 4 ชิ้น)
//      ซึ่งทำให้ผู้เล่นสร้างช่องว่าง (Holes) บนกระดานและไม่สามารถเคลียร์พื้นที่ได้ทัน
//    - ในระบบ 7-bag ชิ้นส่วนเดียวกันจะปรากฏซ้ำติดกันได้ "สูงสุดเพียง 2 ครั้งเท่านั้น"
//      (เกิดขึ้นเมื่อชิ้นนั้นอยู่เป็นชิ้นสุดท้ายของถุงแรก และเป็นชิ้นแรกของถุงถัดไป)
//
// 3. ความกระจายตัวสม่ำเสมอ (Uniform Distribution) และมาตรฐานสากล:
//    - ทุกๆ รอบ 7 ชิ้น จะมี Tetromino ครบทั้ง 7 ชนิด (I, O, T, S, Z, J, L) อย่างละ 1 ชิ้นเสมอ
//    - ระบบนี้เป็นข้อกำหนดทางการใน "Tetris Guideline" ของ The Tetris Company ตั้งแต่ปี 2001
//      เพื่อให้การแข่งขันมีความเสมอภาค สมดุล สนุก และผู้เล่นสามารถใช้ทักษะเชิงกลยุทธ์ได้อย่างเต็มที่
//
// ทำไมต้อง Fisher-Yates Shuffle แทนการใช้ Array.prototype.sort(() => Math.random() - 0.5)?
// - การใช้ sort() ในการสับไพ่จะให้ผลลัพธ์ที่ไม่เป็น Uniform Distribution (เกิด Bias สูง)
// - อัลกอริทึม Fisher-Yates (Knuth Shuffle) รับประกันความน่าจะเป็นของการสลับเท่ากันทุกรูปแบบ
//   (1 / 7! = 1 / 5,040 รูปแบบ) มี Time Complexity O(n) และปลอดภัยตามมาตรฐานคณิตศาสตร์
// ============================================================================

import type { TetrominoType } from '../shared/types';
import { shuffle } from '../shared/utils';

/** รายการชิ้นส่วน Tetromino ทั้ง 7 ชนิดตามมาตรฐาน */
export const TETROMINO_TYPES: readonly TetrominoType[] = [
  'I',
  'O',
  'T',
  'S',
  'Z',
  'J',
  'L',
] as const;

/**
 * สร้างถุงชิ้นส่วนขนาด 7 ชิ้นที่มีครบทั้ง 7 แบบ แล้วสลับลำดับด้วย Fisher-Yates shuffle
 *
 * @param shuffleFn ฟังก์ชันสับลำดับ (default: shuffle จาก shared/utils)
 * @returns Array ของ TetrominoType 7 ชิ้นที่สับลำดับแล้ว
 */
export function createSevenBag(
  shuffleFn: <T>(items: readonly T[]) => T[] = shuffle,
): TetrominoType[] {
  return shuffleFn([...TETROMINO_TYPES]);
}

/**
 * คลาสบริหารจัดการการสุ่มชิ้นส่วน Tetris แบบ 7-bag Randomizer
 */
export class SevenBagRandomizer {
  private bag: TetrominoType[] = [];
  private shuffleFn: <T>(items: readonly T[]) => T[];

  /**
   * @param shuffleFn ฟังก์ชันสับลำดับ (รองรับการทำ Dependency Injection สำหรับ Unit Testing)
   */
  constructor(shuffleFn: <T>(items: readonly T[]) => T[] = shuffle) {
    this.shuffleFn = shuffleFn;
    this.refillBag();
  }

  /**
   * เติมถุงใหม่เมื่อชิ้นส่วนในถุงเดิมหมดลง
   */
  private refillBag(): void {
    const newBag = createSevenBag(this.shuffleFn);
    this.bag.push(...newBag);
  }

  /**
   * หยิบชิ้นส่วนถัดไปออกจากถุง
   * หากถุงว่าง จะเติมถุงใหม่ที่สับด้วย Fisher-Yates แล้วหยิบออกมา
   *
   * @returns ชิ้นส่วน TetrominoType ชิ้นถัดไป
   */
  public next(): TetrominoType {
    if (this.bag.length === 0) {
      this.refillBag();
    }

    const nextPiece = this.bag.shift();
    if (!nextPiece) {
      // Fallback ป้องกันกรณี edge case
      this.refillBag();
      return this.bag.shift() ?? 'I';
    }

    return nextPiece;
  }

  /**
   * ตรวจสอบชิ้นส่วนถัดไปโดยไม่หยิบออกจากถุง (ใช้สำหรับช่องแสดง "Next Piece")
   *
   * @returns ชิ้นส่วน TetrominoType ที่จะถูกหยิบเป็นลำดับถัดไป
   */
  public peek(): TetrominoType {
    if (this.bag.length === 0) {
      this.refillBag();
    }
    return this.bag[0] ?? 'I';
  }

  /**
   * ดูคิวชิ้นส่วนล่วงหน้าจำนวน count ชิ้น โดยไม่กระทบกับคิวปัจจุบัน
   *
   * @param count จำนวนชิ้นที่ต้องการดู
   * @returns Array ของ TetrominoType ล่วงหน้า
   */
  public peekQueue(count: number): TetrominoType[] {
    while (this.bag.length < count) {
      this.refillBag();
    }
    return this.bag.slice(0, count);
  }

  /**
   * จำนวนชิ้นส่วนที่เหลืออยู่ในถุงปัจจุบัน
   */
  public get remainingInBag(): number {
    return this.bag.length;
  }

  /**
   * รีเซ็ตถุงสุ่มใหม่ ล้างชิ้นส่วนเดิมทิ้งแล้วสับถุงใหม่ 7 ชิ้น
   */
  public reset(): void {
    this.bag = [];
    this.refillBag();
  }
}

/** Alias เพื่อความสะดวกในการเรียกใช้ */
export const BagRandomizer = SevenBagRandomizer;
