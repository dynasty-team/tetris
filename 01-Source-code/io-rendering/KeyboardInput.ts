import type { GameAction } from '../shared/types';

const DEFAULT_DAS_MS = 170;
const DEFAULT_ARR_MS = 50;

type RepeatableAction = 'MOVE_LEFT' | 'MOVE_RIGHT' | 'SOFT_DROP';
type ActionHandler = (action: GameAction) => void;
type InputStream = NodeJS.ReadableStream & {
	isTTY?: boolean;
	setRawMode?: (mode: boolean) => void;
	resume?: () => void;
	pause?: () => void;
};

interface KeyboardInputOptions {
	dasMs?: number;
	arrMs?: number;
	input?: InputStream;
}

const KEY_ACTIONS: Record<string, GameAction> = {
	a: 'MOVE_LEFT',
	d: 'MOVE_RIGHT',
	s: 'SOFT_DROP',
	w: 'ROTATE',
	' ': 'HARD_DROP',
	q: 'QUIT',
	'\u001b[D': 'MOVE_LEFT',
	'\u001b[C': 'MOVE_RIGHT',
	'\u001b[B': 'SOFT_DROP',
	'\u001b[A': 'ROTATE',
};

const REPEATABLE_ACTIONS = new Set<RepeatableAction>([
	'MOVE_LEFT',
	'MOVE_RIGHT',
	'SOFT_DROP',
]);

/** Converts raw terminal input into game actions and manages DAS/ARR. */
export class KeyboardInput {
	private readonly input: InputStream;
	private readonly dasMs: number;
	private readonly arrMs: number;
	private onAction: ActionHandler | undefined;
	private activeRepeat: RepeatableAction | undefined;
	private dasTimer: ReturnType<typeof setTimeout> | undefined;
	private arrTimer: ReturnType<typeof setInterval> | undefined;
	private escapeSequence = '';
	private started = false;

	public constructor(options: KeyboardInputOptions = {}) {
		this.input = options.input ?? process.stdin;
		this.dasMs = options.dasMs ?? DEFAULT_DAS_MS;
		this.arrMs = options.arrMs ?? DEFAULT_ARR_MS;
	}

	public start(onAction: ActionHandler): void {
		if (this.started) return;

		this.onAction = onAction;
		this.started = true;
		this.input.setRawMode?.(true);
		this.input.resume?.();
		this.input.on('data', this.handleInput);
	}

	public stop(): void {
		if (!this.started) return;

		this.started = false;
		this.clearRepeat();
		this.onAction = undefined;
		this.input.off('data', this.handleInput);
		this.input.setRawMode?.(false);
		this.input.pause?.();
	}

	private handleInput = (chunk: Uint8Array | string): void => {
		const input = typeof chunk === 'string' ? chunk : new TextDecoder().decode(chunk);
		this.escapeSequence += input;

		while (this.escapeSequence.length > 0) {
			const parsed = this.readNextAction();
			if (parsed === undefined) return;
			if (parsed.action !== undefined) this.handleAction(parsed.action);
			this.escapeSequence = this.escapeSequence.slice(parsed.consumed);
		}
	};

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

	private handleAction(action: GameAction | undefined): void {
		if (action === undefined) return;

		if (REPEATABLE_ACTIONS.has(action as RepeatableAction)) {
			this.startRepeat(action as RepeatableAction);
		} else {
			this.clearRepeat();
			this.onAction?.(action);
		}
	}

	private startRepeat(action: RepeatableAction): void {
		if (this.activeRepeat === action) return;
		this.clearRepeat();
		this.activeRepeat = action;
		this.onAction?.(action);
		this.dasTimer = setTimeout(() => {
			if (this.activeRepeat !== action) return;
			this.onAction?.(action);
			this.arrTimer = setInterval(() => {
				if (this.activeRepeat === action) this.onAction?.(action);
			}, this.arrMs);
		}, this.dasMs);
	}

	private clearRepeat(): void {
		if (this.dasTimer !== undefined) clearTimeout(this.dasTimer);
		if (this.arrTimer !== undefined) clearInterval(this.arrTimer);
		this.dasTimer = undefined;
		this.arrTimer = undefined;
		this.activeRepeat = undefined;
	}
}
