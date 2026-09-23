import { TetrisEngine } from './01-Source-code/core-engine';
import { GameStateLoop } from './01-Source-code/game-state-loop';
import { KeyboardInput } from './01-Source-code/io-rendering/KeyboardInput';
import { renderXX } from './01-Source-code/io-rendering/ConsoleRenderer';
import { saveGame, loadGame } from './01-Source-code/persistence';

async function main(): Promise<void> {
	const engine = new TetrisEngine();
	const input = new KeyboardInput();
	const gameLoop = new GameStateLoop({
		engine,
		input,
		renderer: renderXX,
		onSave: saveGame,
		onLoad: loadGame
	});

	gameLoop.start();
}

void main();