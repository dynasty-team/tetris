import { TetrisEngine } from './01-Source-code/core-engine';
import { GameStateLoop } from './01-Source-code/game-state-loop';
import { KeyboardInput } from './01-Source-code/io-rendering/KeyboardInput';
import { render } from './01-Source-code/io-rendering/ConsoleRenderer';
<<<<<<< HEAD
import type { SaveData } from './01-Source-code/shared/types';
import { validateSaveData } from './01-Source-code/persistence/schema';

const SAVE_FILE = './save-data.json';

async function saveGame(data: SaveData): Promise<void> {
	await Bun.write(SAVE_FILE, JSON.stringify(data, null, 2));
}

async function loadHighScore(): Promise<number> {
	try {
		const savedData: unknown = await Bun.file(SAVE_FILE).json();
		return validateSaveData(savedData) ? savedData.highScore : 0;
	} catch {
		return 0;
	}
}

async function main(): Promise<void> {
	const highScore = await loadHighScore();
	const engine = new TetrisEngine();
	const input = new KeyboardInput();

	console.log(`High score: ${highScore}`);
	console.log('Controls: A/D or arrows move, W/up rotates, S/down soft drops, Space hard drops, Q quits.');

=======
import { saveGame, loadGame } from './01-Source-code/persistence';

async function main(): Promise<void> {
	const savedData = loadGame();
	const highScore = savedData?.highScore ?? 0;
	const engine = new TetrisEngine();
	const input = new KeyboardInput();
>>>>>>> origin/main
	const gameLoop = new GameStateLoop({
		engine,
		input,
		renderer: render,
		onSave: saveGame,
	});

	gameLoop.start();
}

void main();