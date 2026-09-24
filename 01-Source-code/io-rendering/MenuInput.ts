// 01-Source-code/io-rendering/MenuInput.ts
//
// อ่าน Keyboard สำหรับหน้าจอ Menu/HighScore เท่านั้น (คนละชุดกับ KeyboardInput.ts ที่ใช้ตอนเล่นเกมจริง)
// ใช้ persistent reader เพื่อไม่ให้ stream lock/cancel ระหว่างการกดปุ่ม

export type MenuAction = 'UP' | 'DOWN' | 'CONFIRM' | 'QUIT';

const KEY_ACTIONS: Record<string, MenuAction> = {
	w: 'UP',
	s: 'DOWN',
	'\u001b[A': 'UP',
	'\u001b[B': 'DOWN',
	'\u001bOA': 'UP',
	'\u001bOB': 'DOWN',
	'\u001b[5~': 'UP',   // PageUp
	'\u001b[6~': 'DOWN', // PageDown
	'\r': 'CONFIRM',
	'\n': 'CONFIRM',
	' ': 'CONFIRM',
	q: 'QUIT',
	'\u0003': 'QUIT', // Ctrl+C
};

function setRawMode(enabled: boolean): void {
	if (typeof process !== 'undefined' && process.stdin?.isTTY) {
		try {
			process.stdin.setRawMode(enabled);
		} catch {
			// ข้ามหากสภาพแวดล้อมไม่รองรับ TTY
		}
	}
}

interface MenuInputReader {
	read: () => Promise<{ done: boolean; value?: Uint8Array }>;
	releaseLock: () => void;
	cancel?: () => Promise<void>;
}

let activeReader: MenuInputReader | null = null;
let keyBuffer = '';

function getMenuReader(): MenuInputReader {
	if (!activeReader) {
		activeReader = Bun.stdin.stream().getReader() as unknown as MenuInputReader;
	}
	return activeReader;
}

export function closeMenuInput(): void {
	if (activeReader) {
		try {
			activeReader.releaseLock();
		} catch {
			// ข้าม error
		}
		activeReader = null;
	}
	keyBuffer = '';
	try {
		process.stdout.write('\x1b[?25h');
	} catch {
		// ข้าม error
	}
	setRawMode(false);
}

function parseNextAction(buffer: string): { action?: MenuAction; consumed: number } | undefined {
	if (buffer.length === 0) return undefined;

	const first = buffer[0];
	if (first === '\u001b') {
		if (buffer.length === 1) return undefined;
		const second = buffer[1];
		if (second === '[' || second === 'O') {
			if (buffer.length < 3) return undefined;
			if (buffer.length >= 4 && (buffer[2] === '5' || buffer[2] === '6') && buffer[3] === '~') {
				const seq = buffer.slice(0, 4);
				return { action: KEY_ACTIONS[seq], consumed: 4 };
			}
			const seq = buffer.slice(0, 3);
			return { action: KEY_ACTIONS[seq], consumed: 3 };
		}
		return { action: undefined, consumed: 1 };
	}

	return { action: KEY_ACTIONS[first?.toLowerCase() ?? ''], consumed: 1 };
}

/**
 * รออ่านปุ่มถัดไปจากผู้ใช้ แล้วคืนค่า MenuAction
 * ใช้ persistent reader เพื่อให้อ่านซ้ำได้เรื่อยๆ โดย stream ไม่ถูกปิดค้าง
 */
export async function readMenuAction(): Promise<MenuAction | undefined> {
	setRawMode(true);
	const reader = getMenuReader();

	while (true) {
		if (keyBuffer.length > 0) {
			const parsed = parseNextAction(keyBuffer);
			if (parsed !== undefined) {
				keyBuffer = keyBuffer.slice(parsed.consumed);
				if (parsed.action !== undefined) {
					const action = parsed.action;

					// FIX: If holding UP or DOWN, clear out duplicate queued UP/DOWN sequence bytes
					if (action === 'UP' || action === 'DOWN') {
						while (keyBuffer.length > 0) {
							const peek = parseNextAction(keyBuffer);
							if (peek && peek.action === action) {
								// Skip the queued duplicate keypress
								keyBuffer = keyBuffer.slice(peek.consumed);
							} else {
								break;
							}
						}
					}
					return action;
				}
				continue;
			}
		}

		try {
			const { value, done } = await reader.read();
			if (done || value === undefined) {
				closeMenuInput();
				return undefined;
			}

			for (const byte of value) {
				keyBuffer += String.fromCharCode(byte);
			}
		} catch {
			closeMenuInput();
			return undefined;
		}
	}
}

/**
 * รอกดปุ่มใดก็ได้หนึ่งครั้ง — ใช้กับหน้าจอ High Score
 *
 * สำคัญ: ใช้ persistent reader ตัวเดียวกับเมนู (getMenuReader) ไม่สร้าง stream ใหม่
 * และไม่ releaseLock ทิ้งระหว่างหน้าเมนู <-> หน้า High Score
 * เดิมแต่ละหน้าสร้าง Bun.stdin.stream().getReader() ของตัวเองแล้วปล่อยทิ้ง
 * reader เก่าที่ถูกปล่อยอาจยังค้างอ่าน stdin อยู่เบื้องหลังและแย่งปุ่มไป
 * ผลคือกดที่หน้า High Score แล้วไม่ย้อนกลับ / เมนูที่เปิดใหม่ไม่รับปุ่ม
 */
export async function waitForAnyKey(): Promise<void> {
	setRawMode(true);
	const reader = getMenuReader();

	// ทิ้งปุ่มที่ค้างจากตอนกดเลือก "High Score" (เช่น '\n' ที่ตามหลัง '\r')
	// ไม่งั้นจะถูกนับเป็น "กดปุ่มใดก็ได้" ทันที แล้วหน้า High Score แวบหายไป
	keyBuffer = '';

	try {
		const { done } = await reader.read();
		if (done) closeMenuInput();
	} catch {
		closeMenuInput();
	}
}
