import type { SaveData } from "../shared/types";

export const CURRENT_SAVE_VERSION = 1;
/**
 * ตรวจสอบข้อมูล SaveData ที่โหลดมาจากไฟล์
 */
export function validateSaveData(data: unknown): data is SaveData {
    // ต้องเป็น object
    if (typeof data !== "object" || data === null) {
        return false;
    }

    const saveData = data as Record<string, unknown>;

    // ต้องมี version และต้องตรงกับ version ปัจจุบัน
    // ถ้าไม่มี version จะเป็น undefined และ return false
    if (saveData.version !== CURRENT_SAVE_VERSION) {
        return false;
    }

    // ตรวจสอบประเภทข้อมูลของแต่ละ field
    if (typeof saveData.highScore !== "number") {
        return false;
    }

    if (typeof saveData.level !== "number") {
        return false;
    }

    if (typeof saveData.linesCleared !== "number") {
        return false;
    }

    if (typeof saveData.timestamp !== "string") {
        return false;
    }

    return true;
}