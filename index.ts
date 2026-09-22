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

	console.log(`High score: ${highScore}`);
	console.log('Controls:');
	console.log('  A / Left arrow   Move left');
	console.log('  D / Right arrow  Move right');
	console.log('  S / Down arrow   Soft drop');
	console.log('  W / Up arrow     Rotate');
	console.log('  Space            Hard drop');
	console.log('  P                Pause / Resume');
	console.log('  Q                Quit');

	const gameLoop = new GameStateLoop({
		engine,
		input,
		renderer: render,
		onSave: (data) => saveGame({
			...data,
			highScore: Math.max(highScore, data.highScore),
		}),
	});

	gameLoop.start();
}

void main();