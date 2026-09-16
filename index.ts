import { TetrisEngine } from './01-Source-code/core-engine';
import { GameStateLoop } from './01-Source-code/game-state-loop';
import { KeyboardInput } from './01-Source-code/io-rendering/KeyboardInput';
import { render } from './01-Source-code/io-rendering/ConsoleRenderer';
import { saveGame, loadGame } from './01-Source-code/persistence';

async function main(): Promise<void> {
	const savedData = loadGame();
	const highScore = savedData?.highScore ?? 0;
	const engine = new TetrisEngine();
	const input = new KeyboardInput();
	const gameLoop = new GameStateLoop({
		engine,
		input,
		renderer: render,
		onSave: saveGame,
	});

	gameLoop.start();
}

void main();