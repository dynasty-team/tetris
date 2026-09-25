import type { GameAction, InputSource } from '../shared/types';

export type RepeatableAction = 'MOVE_LEFT' | 'MOVE_RIGHT' | 'SOFT_DROP';
export type ActionHandler = (action: GameAction) => void;

export interface TerminalRawMode {
	isTTY?: boolean;
	setRawMode?: (mode: boolean) => void;
}

export interface InputReader {
	read: () => Promise<{ done: boolean; value?: Uint8Array | string }>;
	cancel: () => Promise<void>;
}

export interface InputStream {
	stream: () => {
		getReader: () => InputReader;
	};
}

export interface KeyboardInputOptions {
	dasMs?: number;
	arrMs?: number;
	input?: InputStream;
	terminal?: TerminalRawMode;
}

function createProcessInput(): InputStream {
	const input = process.stdin;
	return {
		stream: () => ({
			getReader: () => {
				const iterator = input[Symbol.asyncIterator]();
				return {
					read: async () => {
						const result = await iterator.next();
						return { done: result.done ?? false, value: result.value };
					},
					cancel: async () => {
						await iterator.return?.();
					},
				};
			},
		}),
	};
}

// แมปปุ่มคีย์บอร์ด -> GameAction (รองรับ WASD, Space, ปุ่มลูกศร ANSI, และ Ctrl+C สำหรับออกจากเกม)
const KEY_ACTIONS: Record<string, GameAction> = {
	a: 'MOVE_LEFT',
	d: 'MOVE_RIGHT',
	s: 'SOFT_DROP',
	w: 'ROTATE',
	p: 'PAUSE',
	' ': 'HARD_DROP',
	'\r': 'QUIT',
	q: 'QUIT',
	'\u0003': 'QUIT', // Ctrl+C (\u0003): ป้องกันกรณีปุ่ม Q ใช้งานไม่ได้ใน Raw Mode
	'\u001b[D': 'MOVE_LEFT',
	'\u001b[C': 'MOVE_RIGHT',
	'\u001b[B': 'SOFT_DROP',
	'\u001b[A': 'ROTATE',
};

/**
 * จัดการ Keyboard Input ใน Raw Mode และแปลงเป็น GameAction
 */
export class KeyboardInput implements InputSource {
	private readonly input: InputStream;
	private readonly terminal: TerminalRawMode | undefined;
	private onAction: ActionHandler | undefined;
	private reader: InputReader | undefined;
	private escapeSequence = '';
	private escapeTimer: ReturnType<typeof setTimeout> | undefined;
	private started = false;

	public constructor(options: KeyboardInputOptions = {}) {
		this.input = options.input ?? createProcessInput();
		this.terminal =
			options.terminal ??
			(typeof process !== 'undefined' && process.stdin?.isTTY ? process.stdin : undefined);
	}

	public start(onAction: ActionHandler): void {
		if (this.started) return;

		this.onAction = onAction;
		this.started = true;

		// Safety Net ระดับ Process: คืนค่า Terminal ทันทีเมื่อได้รับสัญญาณขัดจังหวะหรือ Process กำลังจะปิด
		if (typeof process !== 'undefined' && typeof process.on === 'function') {
			process.on('SIGINT', this.onProcessSigint);
			process.on('SIGTERM', this.onProcessSigint);
			process.on('exit', this.onProcessExit);
		}

		// เปิด Raw Mode เพื่อรับคีย์ทันทีทีละตัวโดยไม่ต้องกด Enter
		if (typeof this.terminal?.setRawMode === 'function') {
			try {
				this.terminal.setRawMode(true);
			} catch {
				// ข้ามหากสภาพแวดล้อมไม่รองรับ TTY
			}
		}

		this.reader = this.input.stream().getReader();
		void this.readInput();
	}

	public release(): void {
		return;
	}

	public stop(): void {
		if (!this.started) return;

		this.started = false;
		this.onAction = undefined;

		if (typeof process !== 'undefined' && typeof process.removeListener === 'function') {
			process.removeListener('SIGINT', this.onProcessSigint);
			process.removeListener('SIGTERM', this.onProcessSigint);
			process.removeListener('exit', this.onProcessExit);
		}

		void this.reader?.cancel();
		this.reader = undefined;
		if (this.escapeTimer !== undefined) {
			clearTimeout(this.escapeTimer);
			this.escapeTimer = undefined;
		}

		// คืนค่า Terminal เป็น Normal Mode เสมอ ป้องกันคอนโซลค้าง
		if (typeof this.terminal?.setRawMode === 'function') {
			try {
				this.terminal.setRawMode(false);
			} catch {
				// ข้ามหากคืนค่าไม่ได้
			}
		}
	}

	// บังคับปิด Raw Mode เมื่อถูกขัดจังหวะ (Ctrl+C / Kill Process)
	private onProcessSigint = (): void => {
		this.stop();
		if (typeof process !== 'undefined' && typeof process.exit === 'function') {
			process.exit(130);
		}
	};

	private onProcessExit = (): void => {
		this.stop();
	};

	// อ่าน Stream แบบวนลูป — มี finally รับประกันว่า stop() จะถูกเรียกเสมอเมื่อ Stream จบหรือมี error
	private async readInput(): Promise<void> {
		if (this.reader === undefined) return;

		try {
			while (this.started) {
				const { value, done } = await this.reader.read();
				if (done) return;
				if (value !== undefined) this.handleInput(value);
			}
		} catch {
			if (this.started) {
				this.stop();
				throw new Error('Failed to read keyboard input.');
			}
		} finally {
			if (this.started) {
				this.stop();
			}
		}
	}

	private handleInput = (chunk: Uint8Array | string): void => {
		if (this.escapeTimer !== undefined) {
			clearTimeout(this.escapeTimer);
			this.escapeTimer = undefined;
		}

		const input = typeof chunk === 'string' ? chunk : new TextDecoder().decode(chunk);
		this.escapeSequence += input;

		while (this.escapeSequence.length > 0) {
			const parsed = this.readNextAction();
			if (parsed === undefined) return;
			// แก้บั๊ก de-dupe: ยิง Action ทันทีทุก keypress โดยไม่กรอง action ซ้ำ เพื่อให้กดปุ่มเดิมซ้ำใน chunk เดียวกันได้ครบถ้วน
			if (parsed.action !== undefined) {
				this.handleAction(parsed.action);
			}
			this.escapeSequence = this.escapeSequence.slice(parsed.consumed);
		}

		if (this.escapeSequence === '\u001b') {
			this.escapeTimer = setTimeout(() => {
				if (this.escapeSequence === '\u001b') {
					this.escapeSequence = '';
					this.handleAction('QUIT');
				}
				this.escapeTimer = undefined;
			}, 25);
		}
	};

	// แยกแยะปุ่มลูกศร (ANSI Escape Sequence 3 ตัวอักษร เช่น \u001b[A) กับปุ่มตัวอักษรเดี่ยวทั่วไป
	private readNextAction(): { action?: GameAction; consumed: number } | undefined {
		const firstCharacter = this.escapeSequence[0];
		if (firstCharacter === '\u001b') {
			if (this.escapeSequence.length === 1) return undefined;
			if (this.escapeSequence.startsWith('\u001b[') && this.escapeSequence.length < 3) return undefined;

			const sequence = this.escapeSequence.slice(0, 3);
			return { action: KEY_ACTIONS[sequence], consumed: 3 };
		}

		return { action: KEY_ACTIONS[firstCharacter?.toLowerCase() ?? ''], consumed: 1 };
	}

	// ส่ง Action ไปยัง Callback — หากเกิด Error ในเกม จะปิด Raw Mode ให้ก่อน เพื่อไม่ให้ Terminal ค้าง
	private handleAction(action: GameAction | undefined): void {
		if (action === undefined) return;

		try {
			this.onAction?.(action);
		} catch (error) {
			this.stop();
			throw error;
		}
	}
}
