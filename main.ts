import { runInkHighScore } from './01-Source-code/io-rendering/InkMenuRenderer';
import { runInkGame } from './01-Source-code/io-rendering/runInkGame';
import { runMainMenu } from './01-Source-code/menu/runMainMenu';
import { loadGame } from './01-Source-code/persistence';

async function main(): Promise<void> {
  while (true) {
    const menuOption = await runMainMenu();

    if (menuOption === 'exit') {
      return;
    }

    if (menuOption === 'highscore') {
      await runInkHighScore(loadGame());
      continue;
    }

    await runInkGame();
  }
}

void main();
