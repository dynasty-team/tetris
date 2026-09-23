import { describe, it, expect, spyOn, beforeEach } from 'bun:test';
import { renderMenu, resetMenuRenderState } from '../../01-Source-code/io-rendering/MenuRenderer';
import { MenuState } from '../../01-Source-code/menu/MenuState';

describe('MenuRenderer', () => {
	beforeEach(() => {
		resetMenuRenderState();
	});

	it('should clear screen on initial render and output menu lines', () => {
		const state = new MenuState();
		const clearSpy = spyOn(console, 'clear').mockImplementation(() => {});
		let written = '';
		const writeSpy = spyOn(process.stdout, 'write').mockImplementation((str) => {
			written += str;
			return true;
		});

		try {
			renderMenu(state);

			expect(clearSpy).toHaveBeenCalledTimes(1);
			expect(written).toContain('Start');
			expect(written).toContain('High Score');
			expect(written).toContain('Exit');
		} finally {
			clearSpy.mockRestore();
			writeSpy.mockRestore();
		}
	});

	it('should use Cursor Home (\\x1b[H) without clearing on subsequent renders', () => {
		const state = new MenuState();
		const clearSpy = spyOn(console, 'clear').mockImplementation(() => {});
		let written = '';
		const writeSpy = spyOn(process.stdout, 'write').mockImplementation((str) => {
			written += str;
			return true;
		});

		try {
			// First render
			renderMenu(state);
			expect(clearSpy).toHaveBeenCalledTimes(1);

			written = '';
			// Subsequent render (e.g. moving Down)
			state.moveDown();
			renderMenu(state);

			// console.clear() should NOT be called again
			expect(clearSpy).toHaveBeenCalledTimes(1);
			// Output must start with cursor home escape code to overwrite in-place
			expect(written.startsWith('\x1b[H')).toBe(true);
			expect(written).toContain('Start');
			expect(written).toContain('High Score');
		} finally {
			clearSpy.mockRestore();
			writeSpy.mockRestore();
		}
	});
});

