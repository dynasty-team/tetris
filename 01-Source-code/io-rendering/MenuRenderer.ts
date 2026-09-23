// 01-Source-code/io-rendering/MenuRenderer.ts
//
// วาดหน้าจอ Main Menu ด้วย ANSI escape code ล้วนๆ (ไม่พึ่ง library ภายนอก)
// สไตล์เดียวกับ ConsoleRenderer.ts เดิม — รับ state เข้ามาแล้วสั่ง console.log

import type { MenuOption, MenuState } from '../menu/MenuState';
import type { SaveData } from '../shared/types';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const BORDER_COLOR = '\x1b[93m'; // เหลือง ตามกรอบในภาพต้นแบบ
const CURSOR_COLOR = '\x1b[91m'; // แดง ตามลูกศร ">"

// สีต่อตัวอักษรของคำว่า TETRIS ให้ล้อกับสีบล็อกคลาสสิก
const TITLE_COLORS = [
  '\x1b[91m', // T แดง
  '\x1b[93m', // E เหลือง/ทอง
  '\x1b[92m', // T เขียว
  '\x1b[94m', // R น้ำเงิน
  '\x1b[95m', // I ม่วง
  '\x1b[35m', // S แมเจนต้า
];

const TITLE_TEXT = 'TETRIS';
const BOX_WIDTH = 48;

function colorTitle(): string {
  return TITLE_TEXT.split('')
    .map((char, i) => `${BOLD}${TITLE_COLORS[i % TITLE_COLORS.length] ?? ''}${char}${RESET}`)
    .join('');
}

// จัดกึ่งกลางข้อความในกรอบ — ต้องรับ visibleLength แยก เพราะ ANSI code ไม่นับเป็นความกว้างจริง
function centerText(text: string, width: number, visibleLength: number): string {
  const padding = Math.max(0, width - visibleLength);
  const left = Math.floor(padding / 2);
  const right = padding - left;
  return ' '.repeat(left) + text + ' '.repeat(right);
}

function wrapLine(inner: string): string {
  return `${BORDER_COLOR}│${RESET}${inner}${BORDER_COLOR}│${RESET}`;
}

function borderLine(edge: 'top' | 'bottom'): string {
  const [left, right] = edge === 'top' ? ['╭', '╮'] : ['╰', '╯'];
  return `${BORDER_COLOR}${left ?? ''}${'─'.repeat(BOX_WIDTH)}${right ?? ''}${RESET}`;
}

function emptyLine(): string {
  return wrapLine(' '.repeat(BOX_WIDTH));
}

function optionLine(option: MenuOption, isSelected: boolean): string {
  const cursor = isSelected ? `${CURSOR_COLOR}${BOLD}>${RESET}` : ' ';
  const label = isSelected ? `${BOLD}${option.label}${RESET}` : `${DIM}${option.label}${RESET}`;
  const visibleLength = 1 + 4 + option.label.length; // cursor + spacing + label
  return wrapLine(centerText(`${cursor}    ${label}`, BOX_WIDTH, visibleLength));
}

export type MenuStateLike =
  | MenuState
  | {
    options: readonly MenuOption[];
    selectedIndex?: number;
    getSelectedIndex?: () => number;
  };

// เดิมมีการ "จำ" ว่าเคย render ไปแล้วหรือยัง แล้วใช้แค่ \x1b[H (cursor home)
// เขียนทับของเดิมในการ render ครั้งถัดๆ ไป โดยไม่ล้างจอก่อน — ปัญหาคือถ้าความสูง
// ของเมนู "มากกว่า" พื้นที่แสดงผลจริงของ terminal (เช่น terminal panel ถูกย่อ,
// หรือ resize) การเขียนจะทำให้ terminal auto-scroll ระหว่างเขียน คือ cursor home
// ที่คำนวณไว้จะไม่ตรงกับตำแหน่งจริงอีกต่อไป ผลคือกรอบเมนูแต่ละเฟรมไม่ถูกเขียนทับ
// แต่กลับถูก "เลื่อนลง" ต่อกันไปเรื่อยๆ ทำให้เห็นกรอบซ้อนกันไล่ยาวลงไปใน terminal
//
// วิธีแก้ที่ใช้ตอนนี้: ล้างจอ "เต็มรูปแบบ" (\x1b[2J\x1b[H) เฉพาะตอน render ครั้งแรก
// (หรือถูกสั่ง forceClear) เท่านั้น ส่วนการ render ถัดๆ ไป (เช่นกดขึ้น-ลงถี่ๆ) จะย้าย
// cursor กลับไปมุมบนซ้ายแล้ว "เขียนทับ" ทีละบรรทัด พร้อมใส่ \x1b[K (clear-to-end-of-line)
// ท้ายทุกบรรทัดเพื่อลบเศษตัวอักษรเก่าที่อาจยาวกว่าบรรทัดใหม่ — ได้ผลลัพธ์แบบเดียวกับ
// clear เต็มจอ (ไม่มีของเก่าค้าง) แต่ "เบา" กว่ามาก เพราะไม่ต้อง repaint ทั้งหน้าจอ/ล้าง
// scrollback buffer ทุกครั้ง ซึ่งบน cmd.exe (legacy Windows console) การล้างทั้งจอ +
// scrollback ทุกครั้งที่กดปุ่มจะหน่วงมากถ้า buffer height ตั้งไว้เยอะ
const FULL_CLEAR = '\x1b[2J\x1b[H';
const CURSOR_HOME = '\x1b[H';
const CLEAR_TO_EOL = '\x1b[K';
const FALLBACK_ROWS = 24; // เผื่อกรณีอ่านขนาด terminal จริงไม่ได้ (ไม่ใช่ TTY)

let lastLineCount = 0;

export function resetMenuRenderState(): void {
  lastLineCount = 0;
}

function getTerminalRows(): number {
  const rows = process.stdout.rows;
  return typeof rows === 'number' && rows > 0 ? rows : FALLBACK_ROWS;
}

/** วาดหน้า Main Menu ตาม state ปัจจุบัน (เรียกซ้ำทุกครั้งที่ selectedIndex เปลี่ยน) */
export function renderMenu(state: MenuStateLike, forceClear = false): void {
  const selectedIndex =
    typeof (state as MenuState).getSelectedIndex === 'function'
      ? (state as MenuState).getSelectedIndex()
      : (state as { selectedIndex?: number }).selectedIndex ?? 0;
  console.clear();

  const lines: string[] = [
    '',
    borderLine('top'),
    emptyLine(),
    wrapLine(centerText(colorTitle(), BOX_WIDTH, TITLE_TEXT.length)),
    emptyLine(),
    emptyLine(),
  ];

  for (const [index, option] of state.options.entries()) {
    lines.push(optionLine(option, index === selectedIndex));
    lines.push(emptyLine());
  }

  lines.push(borderLine('bottom'));
  lines.push('');
  lines.push(`${DIM}  W/S หรือลูกศรขึ้น-ลง เลือกเมนู, Enter ยืนยัน, Q ออก${RESET}`);

  // ถ้าเนื้อหาสูงเกินพื้นที่ terminal ที่มองเห็นจริง การเขียนทับแบบ cursor-home
  // จะทำให้ terminal auto-scroll ระหว่างเขียนเสมอ (ไม่ว่าจะเป็น cmd.exe หรือ terminal
  // ไหนก็ตาม) ทำให้ตำแหน่ง "home" ที่คำนวณไว้เพี้ยนไปทุกเฟรม กลายเป็นกรอบซ้อนกันไล่ลง
  // เหมือนบั๊กเดิม ในกรณีนี้จึงต้อง fallback ไป clear เต็มจอทุกครั้งแทน (ยอมแลกความเร็ว
  // เล็กน้อยเพื่อความถูกต้อง) — ถ้าเนื้อหาพอดีกับพื้นที่จริง จึงค่อยใช้วิธีเขียนทับแบบเบา
  const fitsInTerminal = lines.length <= getTerminalRows();
  const needsFullClear =
    forceClear || lastLineCount === 0 || lastLineCount !== lines.length || !fitsInTerminal;
  lastLineCount = lines.length;

  if (needsFullClear) {
    process.stdout.write(FULL_CLEAR + lines.join('\n') + '\n');
  } else {
    // เขียนทับทีละบรรทัดจากมุมบนซ้าย พร้อม clear-to-end-of-line กันเศษตัวอักษรเก่าค้าง
    const content = lines.map((line) => line + CLEAR_TO_EOL).join('\n');
    process.stdout.write(CURSOR_HOME + content + '\n');
  }
}

/** วาดหน้าจอ High Score แบบสั้นๆ แล้วรอผู้เล่นกดปุ่มเพื่อย้อนกลับ */
export function renderHighScore(data: SaveData | null): void {
  const lines: string[] = [
    '',
    borderLine('top'),
    emptyLine(),
    wrapLine(centerText(`${BOLD}HIGH SCORE${RESET}`, BOX_WIDTH, 10)),
    emptyLine(),
  ];

  if (data) {
    const stats = [
      `Score : ${data.highScore}`,
      `Level : ${data.level}`,
      `Lines : ${data.linesCleared}`,
    ];
    for (const stat of stats) {
      lines.push(wrapLine(centerText(stat, BOX_WIDTH, stat.length)));
    }
  } else {
    const line = 'ยังไม่มีสถิติ — ลองเล่นดูสักตา!';
    lines.push(wrapLine(centerText(line, BOX_WIDTH, line.length)));
  }

  lines.push(emptyLine());
  lines.push(borderLine('bottom'));
  lines.push('');
  lines.push(`${DIM}  กดปุ่มใดก็ได้เพื่อย้อนกลับ${RESET}`);

  process.stdout.write(FULL_CLEAR + lines.join('\n') + '\n');
}