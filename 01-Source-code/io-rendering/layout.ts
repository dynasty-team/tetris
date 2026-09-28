// 01-Source-code/io-rendering/layout.ts
//
// คำนวณขนาดเทอร์มินัลขั้นต่ำที่จำเป็นสำหรับแสดงผล Tetris UI (ConsoleRenderer.tsx)
// โดยอ้างอิงจากขนาดจริงของแต่ละองค์ประกอบใน layout ปัจจุบัน (ไม่ใช้ค่า magic number ลอยๆ)
// แยกออกมาเป็น pure function/constants เพื่อให้ทดสอบได้โดยไม่ต้อง render Ink จริง

import { BOARD_WIDTH, BOARD_HEIGHT } from '../shared/constants';

// แต่ละ cell บน board วาดด้วยอักขระกว้าง 3 ช่อง เสมอ ("┼──" สำหรับช่องว่าง, "███" สำหรับช่องที่มีบล็อก)
// ดู Cell() ใน ConsoleRenderer.tsx
export const CELL_GLYPH_WIDTH = 3;

// BoardView: borderStyle="double" (1 คอลัมน์ซ้าย + 1 คอลัมน์ขวา) + paddingX={1} (1 ซ้าย + 1 ขวา)
const BOARD_BORDER_WIDTH = 2;
const BOARD_PADDING_WIDTH = 2;
export const BOARD_PANEL_WIDTH =
	BOARD_WIDTH * CELL_GLYPH_WIDTH + BOARD_BORDER_WIDTH + BOARD_PADDING_WIDTH;

// BoardView: one terminal row per board row plus top/bottom borders; no vertical padding
const BOARD_BORDER_HEIGHT = 2;
export const BOARD_PANEL_HEIGHT = BOARD_HEIGHT + BOARD_BORDER_HEIGHT;

// ความกว้างคงที่ของแผง Controls / InfoPanel (กำหนดไว้ตรงๆ ด้วย prop `width` ใน component)
export const CONTROLS_PANEL_WIDTH = 32;
export const INFO_PANEL_WIDTH = 30;

// ช่องว่างแนวนอนระหว่าง 3 แผงใน Game Area (Box gap={1})
const GAME_AREA_GAP = 1;

// ความสูงของ Header ("✦ TETRIS ✦" + borderStyle="double") และแถว Status ด้านล่าง
// รวมถึง marginTop={1} ที่คั่นระหว่าง Header/GameArea และ GameArea/Status
const HEADER_HEIGHT = 3;
const STATUS_HEIGHT = 1;
const VERTICAL_MARGIN = 1;

/**
 * ความกว้างขั้นต่ำของเทอร์มินัล (คอลัมน์) ที่ทำให้ทั้ง 3 แผง
 * (Controls + Board + InfoPanel พร้อม gap คั่นกลาง) แสดงผลได้ครบไม่ overflow
 */
export const MIN_TERMINAL_WIDTH =
	CONTROLS_PANEL_WIDTH + GAME_AREA_GAP + BOARD_PANEL_WIDTH + GAME_AREA_GAP + INFO_PANEL_WIDTH;

/**
 * ความสูงขั้นต่ำของเทอร์มินัล (แถว) ที่ทำให้ Header, Game Area (อ้างอิงจาก Board
 * ซึ่งเป็นแผงที่สูงที่สุด) และแถว Status แสดงผลได้ครบไม่ overflow
 */
export const MIN_TERMINAL_HEIGHT =
	HEADER_HEIGHT + VERTICAL_MARGIN + BOARD_PANEL_HEIGHT + VERTICAL_MARGIN + STATUS_HEIGHT;

/**
 * เช็คว่าขนาดเทอร์มินัลปัจจุบันเล็กเกินกว่าจะแสดง Tetris UI ได้ครบถ้วนหรือไม่
 */
export function isTerminalTooSmall(columns: number, rows: number): boolean {
	return columns < MIN_TERMINAL_WIDTH || rows < MIN_TERMINAL_HEIGHT;
}
