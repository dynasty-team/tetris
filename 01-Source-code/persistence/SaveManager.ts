// 01-Source-code/persistence/SaveManager.ts
//
// โมดูลสำหรับจัดการบันทึกและโหลดสถานะเกม (Persistence Layer)
// รองรับการเขียนและอ่านไฟล์ JSON ตาม SaveData schema
// พร้อมการจัดการข้อผิดพลาด (Graceful Error Handling) เพื่อไม่ให้เกม crash

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { SaveData } from '../shared/types';
import { validateSaveData } from './schema';

export const DEFAULT_SAVE_FILE = './save-data.json';

/**
 * บันทึกข้อมูลสถานะเกมลงไฟล์ JSON ตาม schema จาก save-data.json
 * - สร้างไฟล์ใหม่หากยังไม่มี หรือ overwrite หากมีไฟล์อยู่แล้ว
 * - จัดการข้อผิดพลาด (เช่น สิทธิ์ไม่พอ, disk เต็ม, ข้อมูลไม่ตรง schema) อย่างปลอดภัย ไม่ทำให้เกม crash
 *
 * @param data ข้อมูล SaveData ที่ต้องการบันทึก
 * @param filePath ตำแหน่งไฟล์ที่ต้องการบันทึก (ค่าเริ่มต้น: './save-data.json')
 */
export function saveGame(data: SaveData, filePath: string = DEFAULT_SAVE_FILE): void {
  try {
    // ตรวจสอบ schema ก่อนบันทึก
    if (!validateSaveData(data)) {
      console.error('Failed to save game: data does not match SaveData schema.', data);
      return;
    }

    // สร้าง directory หากยังไม่มี
    const dir = path.dirname(filePath);
    if (dir && dir !== '.' && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const jsonString = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, jsonString, 'utf-8');
  } catch (error) {
    // จัดการข้อผิดพลาดแบบ graceful (เช่น EACCES, ENOSPC, EPERM) โดยไม่ throw ออกไปขัดจังหวะเกม
    console.error(`Failed to save game to "${filePath}":`, error);
  }
}

/**
 * โหลดข้อมูลสถานะเกมจากไฟล์ JSON
 * - ตรวจสอบความถูกต้องของข้อมูลตาม SaveData schema
 * - หากไฟล์ไม่มีอยู่ หรือข้อมูลไม่ถูกต้อง จะ return null โดยไม่ทำให้เกิด crash
 *
 * @param filePath ตำแหน่งไฟล์ที่ต้องการอ่าน (ค่าเริ่มต้น: './save-data.json')
 * @returns SaveData หากโหลดและ validate ผ่าน หรือ null หากล้มเหลว
 */
export function loadGame(filePath: string = DEFAULT_SAVE_FILE): SaveData | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed: unknown = JSON.parse(content);

    if (validateSaveData(parsed)) {
      return parsed;
    }

    console.warn(`Failed to load game: data in "${filePath}" does not match SaveData schema.`);
    return null;
  } catch (error) {
    console.error(`Failed to load game from "${filePath}":`, error);
    return null;
  }
}

/**
 * Class SaveManager สำหรับจัดการ Persistence ในรูปแบบ Object-Oriented
 */
export class SaveManager {
  private readonly filePath: string;

  constructor(filePath: string = DEFAULT_SAVE_FILE) {
    this.filePath = filePath;
  }

  /**
   * บันทึกข้อมูลเกมลงใน path ที่กำหนดใน instance
   */
  public save(data: SaveData): void {
    saveGame(data, this.filePath);
  }

  /**
   * โหลดข้อมูลเกมจาก path ที่กำหนดใน instance
   */
  public load(): SaveData | null {
    return loadGame(this.filePath);
  }

  public static saveGame(data: SaveData, filePath: string = DEFAULT_SAVE_FILE): void {
    saveGame(data, filePath);
  }

  public static loadGame(filePath: string = DEFAULT_SAVE_FILE): SaveData | null {
    return loadGame(filePath);
  }
}

