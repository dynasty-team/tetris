import { describe, test, expect } from 'bun:test';
import {
	MIN_TERMINAL_WIDTH,
	MIN_TERMINAL_HEIGHT,
	BOARD_PANEL_WIDTH,
	BOARD_PANEL_HEIGHT,
	CONTROLS_PANEL_WIDTH,
	INFO_PANEL_WIDTH,
	isTerminalTooSmall,
} from '../../01-Source-code/io-rendering/layout';

describe('layout constants', () => {
	test('minimum width matches the sum of the three game-area panels plus gaps', () => {
		// Controls + gap(1) + Board + gap(1) + InfoPanel
		expect(MIN_TERMINAL_WIDTH).toBe(CONTROLS_PANEL_WIDTH + 1 + BOARD_PANEL_WIDTH + 1 + INFO_PANEL_WIDTH);
	});

	test('board panel dimensions match the 10x20 board with 3-char cells and its border/padding', () => {
		expect(BOARD_PANEL_WIDTH).toBe(34); // (10 * 3) + border(2) + paddingX(2)
		expect(BOARD_PANEL_HEIGHT).toBe(22); // 20 rows + border top/bottom(2)
	});

	test('computed minimums match the layout as actually measured in a live terminal', () => {
		expect(MIN_TERMINAL_WIDTH).toBe(98);
		expect(MIN_TERMINAL_HEIGHT).toBe(28);
	});
});

describe('isTerminalTooSmall', () => {
	test('is false at exactly the minimum size', () => {
		expect(isTerminalTooSmall(MIN_TERMINAL_WIDTH, MIN_TERMINAL_HEIGHT)).toBe(false);
	});

	test('is false comfortably above the minimum size', () => {
		expect(isTerminalTooSmall(120, 40)).toBe(false);
	});

	test('is true when width is one column short', () => {
		expect(isTerminalTooSmall(MIN_TERMINAL_WIDTH - 1, MIN_TERMINAL_HEIGHT)).toBe(true);
	});

	test('is true when height is one row short', () => {
		expect(isTerminalTooSmall(MIN_TERMINAL_WIDTH, MIN_TERMINAL_HEIGHT - 1)).toBe(true);
	});

	test('is true when both dimensions are far too small (e.g. default 80x24 fallback)', () => {
		expect(isTerminalTooSmall(80, 24)).toBe(true);
	});
});
