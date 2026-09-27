// 01-Source-code/persistence/SaveManager.ts
//
// โมดูลสำหรับจัดการบันทึกและโหลดสถานะเกม (Persistence Layer)
// รองรับการเขียนและอ่านไฟล์ JSON ตาม SaveData schema
// พร้อมการจัดการข้อผิดพลาด (Graceful Error Handling) เพื่อไม่ให้เกม crash

import { mkdir } from 'node:fs/promises';
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
export async function saveGame(data: SaveData, filePath: string = DEFAULT_SAVE_FILE): Promise<void> {
  try {
    // ตรวจสอบ schema ก่อนบันทึก
    if (!validateSaveData(data)) {
      console.error('Failed to save game: data does not match SaveData schema.', data);
      return;
    }

    // ตรวจสอบว่า filePath เป็น directory หรือไม่
    const file = Bun.file(filePath);
    const fileStat = await file.stat().catch(() => null);
    if (filePath.endsWith('/') || filePath.endsWith('\\') || fileStat?.isDirectory()) {
      console.error(`Failed to save game: "${filePath}" is a directory.`);
      return;
    }

    // สร้าง directory หากยังไม่มี
    const dir = path.dirname(filePath);
    if (dir && dir !== '.') {
      await mkdir(dir, { recursive: true });
    }

    const jsonString = JSON.stringify(data, null, 2);
    await Bun.write(filePath, jsonString);
  } catch (error) {
    // จัดการข้อผิดพลาดแบบ graceful (เช่น EACCES, ENOSPC, EPERM) โดยไม่ throw ออกไปขัดจังหวะเกม
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to save game to "${filePath}": ${errorMessage}`);
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
export async function loadGame(filePath: string = DEFAULT_SAVE_FILE): Promise<SaveData | null> {
  try {
    const file = Bun.file(filePath);
    const fileStat = await file.stat().catch(() => null);
    if (fileStat?.isDirectory()) {
      console.error(`Failed to load game: "${filePath}" is a directory.`);
      return null;
    }
    if (!fileStat) return null;

    const content = await file.text();
    const parsed: unknown = JSON.parse(content);

    if (validateSaveData(parsed)) {
      return parsed;
    }

    console.warn(`Failed to load game: data in "${filePath}" does not match SaveData schema.`);
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to load game from "${filePath}": ${errorMessage}`);
    return null;
  }
}





