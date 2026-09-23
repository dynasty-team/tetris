import { TetrisEngine } from './01-Source-code/core-engine';
import { GameStateLoop } from './01-Source-code/game-state-loop';
import { KeyboardInput } from './01-Source-code/io-rendering/KeyboardInput';
import { render } from './01-Source-code/io-rendering/ConsoleRenderer';
import { runInkHighScore } from './01-Source-code/io-rendering/InkMenuRenderer';
import { runMainMenu } from './01-Source-code/menu/runMainMenu';
import { saveGame, loadGame } from './01-Source-code/persistence';

async function playGame(): Promise<void> {
	const engine = new TetrisEngine();
	const input = new KeyboardInput();

	await new Promise<void>((resolve) => {
		const gameLoop = new GameStateLoop({
			engine,
			input,
			renderer: render,
			onSave: saveGame,
			onLoad: loadGame,
			// NOTE: ต้องเพิ่ม onExit callback ใน GameStateLoop ก่อน (ดูคำอธิบายด้านล่าง)
			// ให้เรียก this.onExit?.() ท้าย stop() และ handleGameOver()
			onExit: resolve,
		} as ConstructorParameters<typeof GameStateLoop>[0] & { onExit: () => void });

		gameLoop.start();
	});
}

async function showHighScore(): Promise<void> {
	const data = loadGame();
	await runInkHighScore(data);
}

async function main(): Promise<void> {
	while (true) {
		const choice = await runMainMenu();

		if (choice === 'exit') {
			console.clear();
			process.exit(0);
		}

		if (choice === 'highscore') {
			await showHighScore();
			continue;
		}

		// choice === 'start'
		await playGame();
	}
}

void main();