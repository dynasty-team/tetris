// 01-Source-code/menu/runMainMenu.ts
//
// วนลูปหน้า Main Menu จนกว่าผู้เล่นจะเลือกคำสั่ง
// MenuState ยังเป็น state หลักเหมือนเดิม แต่การแสดงผล/input หน้า menu
// ย้ายไปใช้ Ink เพื่อให้ UI declarative และอ่านโครงสร้างง่ายขึ้น

import { runInkMainMenu } from '../io-rendering/InkMenuRenderer';
import { MenuState, type MenuOptionId } from './MenuState';
import { KeyboardInput } from '../io-rendering/KeyboardInput';

export async function runMainMenu(keyboard?: KeyboardInput): Promise<MenuOptionId> {
  const state = new MenuState();
  return runInkMainMenu(state, keyboard);
}
