import type { GameAction, InputSource } from '../shared/types';

export type RepeatableAction = 'MOVE_LEFT' | 'MOVE_RIGHT' | 'SOFT_DROP';
export type ActionHandler = (action: GameAction) => void;
export type MenuKeyboardAction = 'UP' | 'DOWN' | 'CONFIRM' | 'QUIT';
export type KeyboardAction = GameAction | MenuKeyboardAction;
export type KeyboardActionHandler = (action: KeyboardAction) => void;
export type KeyboardInputMode = 'game' | 'menu';

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
	/** หยุด stdin หลังเลิกใช้งาน เพื่อไม่ให้ process/TTY ค้าง */
	pause?: () => void;
	/** เริ่ม stdin ใหม่เมื่อเข้าสู่ game/menu */
	resume?: () => void;
	/** ควบคุม process reference ของ stdin */
	ref?: () => void;
	unref?: () => void;
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
		pause: () => input.pause(),
		resume: () => input.resume(),
		ref: () => input.ref(),
		unref: () => input.unref(),
		stream: () => ({
			getReader: () => {
				let cancelled = false;
				let pendingResolve: ((result: { done: boolean; value?: Uint8Array | string }) => void) | undefined;
				const onData = (value: Uint8Array | string): void => {
					const resolve = pendingResolve;
					pendingResolve = undefined;
					resolve?.({ done: false, value });
				};
				const onEnd = (): void => {
					const resolve = pendingResolve;
					pendingResolve = undefined;
					resolve?.({ done: true });
				};

				input.on('data', onData);
				input.once('end', onEnd);
				input.once('close', onEnd);

				return {
					read: async () => {
						if (cancelled) return { done: true };
						return new Promise((resolve) => {
							pendingResolve = resolve;
						});
					},
					cancel: async () => {
						if (cancelled) return;
						cancelled = true;
						input.removeListener('data', onData);
						input.removeListener('end', onEnd);
						input.removeListener('close', onEnd);
						const resolve = pendingResolve;
						pendingResolve = undefined;
						resolve?.({ done: true });
					},
				};
			},
		}),
	};
}

// แมปปุ่มคีย์บอร์ด -> action ของเกมหรือเมนู
const GAME_KEY_ACTIONS: Record<string, GameAction | 'CONFIRM'> = {
	a: 'MOVE_LEFT',
	d: 'MOVE_RIGHT',
	s: 'SOFT_DROP',
	w: 'ROTATE',
	p: 'PAUSE',
	' ': 'HARD_DROP',
	'\r': 'CONFIRM',
	'\n': 'CONFIRM',
	q: 'QUIT',
	'\u0003': 'QUIT', // Ctrl+C (\u0003): ป้องกันกรณีปุ่ม Q ใช้งานไม่ได้ใน Raw Mode
	'\u001b[D': 'MOVE_LEFT',
	'\u001b[C': 'MOVE_RIGHT',
	'\u001b[B': 'SOFT_DROP',
	'\u001b[A': 'ROTATE',
	'\u001b': 'QUIT',
};

const MENU_KEY_ACTIONS: Record<string, MenuKeyboardAction> = {
	w: 'UP',
	s: 'DOWN',
	'\u001b[A': 'UP',
	'\u001bOA': 'UP',
	'\u001b[B': 'DOWN',
	'\u001bOB': 'DOWN',
	'\u001b[5~': 'UP',
	'\u001b[6~': 'DOWN',
	'\r': 'CONFIRM',
	'\n': 'CONFIRM',
	' ': 'CONFIRM',
	b: 'QUIT',
	q: 'QUIT',
	'\u0003': 'QUIT',
	'\u001b': 'QUIT',
};

/**
 * จัดการ Keyboard Input ใน Raw Mode และแปลงเป็น GameAction
 */
export class KeyboardInput implements InputSource {
	private readonly input: InputStream;
	private readonly terminal: TerminalRawMode | undefined;
	private onAction: KeyboardActionHandler | undefined;
	private mode: KeyboardInputMode = 'game';
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

	public start(onAction: ActionHandler): void;
	public start(onAction: KeyboardActionHandler, mode: KeyboardInputMode): void;
	public start(
		onAction: ActionHandler | KeyboardActionHandler,
		mode: KeyboardInputMode = 'game',
	): void {
		if (this.started) return;

		this.onAction = onAction as KeyboardActionHandler;
		this.mode = mode;
		this.started = true;

		// เปิด Raw Mode เพื่อรับคีย์ทันทีทีละตัวโดยไม่ต้องกด Enter
		if (typeof this.terminal?.setRawMode === 'function') {
			try {
				this.terminal.setRawMode(true);
			} catch {
				// ข้ามหากสภาพแวดล้อมไม่รองรับ TTY
			}
		}

		this.reader = this.input.stream().getReader();
		// ให้ stdin เป็น handle ที่มีชีวิตตลอดช่วงที่ KeyboardInput ทำงาน
		this.input.resume?.();
		this.input.ref?.();
		void this.readInput();
	}

	/** หยุดรับคีย์ของหน้าปัจจุบัน แต่ยังไม่คืน Terminal เพื่อให้หน้าใหม่รับช่วงต่อได้ทันที */
	public stop(): void {
		if (this.started) {
			this.started = false;
			this.onAction = undefined;

			void this.reader?.cancel();
			this.reader = undefined;

			// สำคัญระหว่างเปลี่ยนหน้า: หยุด flowing mode เพื่อไม่ให้ stdin
			// กิน key ทิ้งในช่วงสั้น ๆ ระหว่าง Menu -> Game -> Menu
			// แต่ยังคง raw mode และ process reference ไว้ให้ session ถัดไปรับช่วงต่อ
			this.input.pause?.();
		}

		if (this.escapeTimer !== undefined) {
			clearTimeout(this.escapeTimer);
			this.escapeTimer = undefined;
		}
		this.escapeSequence = '';
	}

	/**
	 * คืน Terminal/STDIN เมื่อจบโปรแกรมหรือจบ input session จริง ๆ
	 * ไม่ควรถูกเรียกระหว่างการเปลี่ยนหน้าเกม -> menu
	 */
	public release(): void {
		this.stop();
		this.releaseTerminal();
	}

	public releaseTerminal(): void {
		if (typeof this.terminal?.setRawMode === 'function') {
			try {
				this.terminal.setRawMode(false);
			} catch {
				// ข้ามหากคืนค่าไม่ได้
			}
		}

		// ปิด flowing mode และปล่อย stdin handle เฉพาะตอนจบ session จริง
		this.input.pause?.();
		this.input.unref?.();
	}

	// อ่าน Stream แบบวนลูป — มี finally รับประกันว่า stop() จะถูกเรียกเสมอเมื่อ Stream จบหรือมี error
	private async readInput(): Promise<void> {
		if (this.reader === undefined) return;

		try {
			while (this.started) {
				const { value, done } = await this.reader.read();
				if (done) {
					if (this.escapeSequence === '\u001b') {
						if (this.escapeTimer !== undefined) clearTimeout(this.escapeTimer);
						this.escapeTimer = undefined;
						this.escapeSequence = '';
						this.handleAction(this.mode === 'menu'
							? MENU_KEY_ACTIONS['\u001b']
							: GAME_KEY_ACTIONS['\u001b']);
					}
					return;
				}
				if (value !== undefined) this.handleInput(value);
			}
		} catch {
			if (this.started) {
				this.stop();
			}
		} finally {
			if (this.started) {
				this.stop();
				this.releaseTerminal();
			}
		}
	}

	private handleInput = (chunk: Uint8Array | string): void => {
		const input = typeof chunk === 'string' ? chunk : new TextDecoder().decode(chunk);
		if (this.escapeTimer !== undefined) {
			clearTimeout(this.escapeTimer);
			this.escapeTimer = undefined;
		}
		this.escapeSequence += input;

		while (this.escapeSequence.length > 0) {
			const parsed = this.readNextAction();
			if (parsed === undefined) {
				// ESC เดี่ยวต้องรอแยกจาก ANSI sequence เช่น ESC[A (Arrow Up) ก่อน
				// จุดสำคัญคือห้าม return ก่อนตั้ง timer ไม่เช่นนั้น ESC จะไม่ถูกส่ง action เลย
				this.scheduleStandaloneEscape();
				return;
			}

			if (parsed.action !== undefined) {
				this.handleAction(parsed.action);
			}
			this.escapeSequence = this.escapeSequence.slice(parsed.consumed);
		}

		this.scheduleStandaloneEscape();
	};

	private scheduleStandaloneEscape(): void {
		if (this.escapeSequence !== '\u001b' || this.escapeTimer !== undefined) return;

		this.escapeTimer = setTimeout(() => {
			this.escapeTimer = undefined;
			if (!this.started || this.escapeSequence !== '\u001b') return;
			this.escapeSequence = '';
			this.handleAction(this.mode === 'menu' ? MENU_KEY_ACTIONS['\u001b'] : GAME_KEY_ACTIONS['\u001b']);
		}, 30);
	}

	// แยกแยะปุ่มลูกศร (ANSI Escape Sequence 3 ตัวอักษร เช่น \u001b[A) กับปุ่มตัวอักษรเดี่ยวทั่วไป
	private readNextAction(): { action?: KeyboardAction; consumed: number } | undefined {
		const firstCharacter = this.escapeSequence[0];
		if (firstCharacter === '\u001b') {
			if (this.escapeSequence.length === 1) {
				return undefined;
			}

			const sequences = this.mode === 'menu' ? MENU_KEY_ACTIONS : GAME_KEY_ACTIONS;
			const knownSequence = Object.keys(sequences).find(
				(sequence) => sequence.length > 1 && this.escapeSequence.startsWith(sequence),
			);
			if (knownSequence === undefined) {
				if (this.escapeSequence.startsWith('\u001b[') && this.escapeSequence.length < 3) return undefined;
				return { consumed: 1 };
			}

			const hasIncompleteLongerSequence = Object.keys(sequences).some(
				(sequence) => sequence.length > this.escapeSequence.length
					&& sequence.startsWith(this.escapeSequence),
			);
			if (hasIncompleteLongerSequence) return undefined;

			return { action: sequences[knownSequence], consumed: knownSequence.length };
		}

		const sequences = this.mode === 'menu' ? MENU_KEY_ACTIONS : GAME_KEY_ACTIONS;
		const key = firstCharacter?.toLowerCase() ?? '';
		return { action: sequences[key], consumed: 1 };
	}

	// ส่ง Action ไปยัง Callback — หากเกิด Error ในเกม จะปิด Raw Mode ให้ก่อน เพื่อไม่ให้ Terminal ค้าง
	private handleAction(action: KeyboardAction | undefined): void {
		if (action === undefined) return;

		try {
			this.onAction?.(action);
		} catch (error) {
			this.stop();
			throw error;
		}
	}
}
