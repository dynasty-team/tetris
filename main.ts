import { TetrisEngine } from './01-Source-code/core-engine';
import { GameStateLoop } from './01-Source-code/game-state-loop';
import { KeyboardInput } from './01-Source-code/io-rendering/KeyboardInput';
import { render } from './01-Source-code/io-rendering/ConsoleRenderer';
import { runInkHighScore } from './01-Source-code/io-rendering/InkMenuRenderer';
import { runMainMenu } from './01-Source-code/menu/runMainMenu';
import { saveGame, loadGame } from './01-Source-code/persistence';

async function main(): Promise<void> {
	const menuOption = await runMainMenu();

	if (menuOption === 'exit') return;

	if (menuOption === 'highscore') {
		await runInkHighScore(loadGame());
		return main();
	}

	const engine = new TetrisEngine();
	const input = new KeyboardInput();
	const gameLoop = new GameStateLoop({
		engine,
		input,
		renderer: render,
		onSave: saveGame,
		onLoad: loadGame
	});

	gameLoop.start();
}

void main();